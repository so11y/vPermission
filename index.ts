import { baseParse, findDir, NodeTransform } from "@vue/compiler-core";
import { MagicString, parse, SFCDescriptor } from "@vue/compiler-sfc";
import { Plugin } from "vite";

import { BuilderHoistElement } from "./builderHoistElement";


function replaceHoistNode(magicString: MagicString, descriptor: SFCDescriptor) {
  const onNode: NodeTransform = (node) => {
    return () => {
      // const { loc: templateLocStart } = descriptor.template!;
      if (node.type === 1 /** NodeTypes.ELEMENT */) {
        if (findDir(node, "hasPermission")) {
          const { loc: originNodeLoc } = node;
          // const child = first(
          //   baseParse(originNodeLoc.source, {
          //     onError: () => {}
          //   }).children
          // )!;
          const child = node;
          if (child.type === 1) {
            // const tmpStartOffset = templateLocStart.start.offset;
            const prevChangeString = magicString.slice(
              originNodeLoc.start.offset,
              originNodeLoc.end.offset
            );
            const childMs = new MagicString(prevChangeString.toString());
            const bhe = new BuilderHoistElement(child, childMs);
            const { loc } = node;
            magicString.overwrite(
              loc.start.offset,
              loc.end.offset,
              bhe.getBuilderNodeString()
            );
          }
        }
      }
    };
  };
  return onNode;
}

function traverseTemplateIterative(
  descriptor: SFCDescriptor,
  transform: NodeTransform
) {
  const tpl = descriptor.template!;
  const root =
    (tpl as any).ast ?? baseParse(tpl.content, { onError: () => {} });

  type Frame = {
    node: any;
    childIndex: number;
    exit?: (() => void) | void;
    entered?: boolean;
  };

  const stack: Frame[] = [{ node: root, childIndex: 0 }];

  while (stack.length) {
    const frame = stack[stack.length - 1];
    const node = frame.node;
    if (!node) {
      stack.pop();
      continue;
    }

    if (!frame.entered) {
      frame.entered = true;
      const maybeExit = (transform as any)(node);
      if (typeof maybeExit === "function") frame.exit = maybeExit;
    }

    const children = node.children;
    if (children && frame.childIndex < children.length) {
      const child = children[frame.childIndex++];
      stack.push({ node: child, childIndex: 0 });
      continue;
    }

    if (frame.exit) {
      frame.exit();
    }
    stack.pop();
  }
}

export function replaceHoistNodePlugin(debug = false): Plugin {
  return {
    name: "vite-replace_hoist_node",
    enforce: "pre",
    transform(source, id) {
      if (id.endsWith(".vue") && source.includes("v-hasPermission")) {
        const { descriptor } = parse(source);
        if (descriptor.template) {
          const magicString = new MagicString(source);
          traverseTemplateIterative(
            descriptor,
            replaceHoistNode(magicString, descriptor)
          );
          debug && console.log("--------");
          debug && console.log(magicString.toString());
          return magicString.toString();
        }
      }
    }
  };
}

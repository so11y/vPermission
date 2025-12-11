import { baseParse, findDir, NodeTransform } from "@vue/compiler-core";
import {
  compileTemplate,
  MagicString,
  parse,
  SFCDescriptor
} from "@vue/compiler-sfc";
import { first } from "lodash-es";
import { Plugin } from "vite";

import { BuilderHoistElement } from "./builderHoistElement";

function replaceHoistNode(magicString: MagicString, descriptor: SFCDescriptor) {
  const onNode: NodeTransform = (node) => {
    return () => {
      const { loc: templateLocStart } = descriptor.template!;
      if (node.type === 1 /** NodeTypes.ELEMENT */) {
        if (findDir(node, "hasPermission")) {
          const { loc: originNodeLoc } = node;
          const child = first(
            baseParse(originNodeLoc.source, {
              onError: () => {}
            }).children
          )!;
          if (child.type === 1) {
            const tmpStartOffset = templateLocStart.start.offset;
            const prevChangeString = magicString.slice(
              tmpStartOffset + originNodeLoc.start.offset,
              tmpStartOffset + originNodeLoc.end.offset
            );
            const childMs = new MagicString(prevChangeString.toString());
            const bhe = new BuilderHoistElement(child, childMs);
            const { loc } = node;
            magicString.overwrite(
              tmpStartOffset + loc.start.offset,
              tmpStartOffset + loc.end.offset,
              bhe.getBuilderNodeString()
            );
          }
        }
      }
    };
  };
  return onNode;
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
          compileTemplate({
            filename: id,
            source: descriptor.template.content,
            id,
            compilerOptions: {
              nodeTransforms: [replaceHoistNode(magicString, descriptor)]
            }
          });
          debug && console.log("--------");
          debug && console.log(magicString.toString());
          return magicString.toString();
        }
      }
    }
  };
}

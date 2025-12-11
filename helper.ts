import {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  findDir,
  findProp
} from "@vue/compiler-core";
import { MagicString } from "@vue/compiler-sfc";

import { type BuilderHoistElement } from "./builderHoistElement";
const hasPermissionPropsHelps = {
  link() {
    return "link";
  },
  menu() {
    return `mode="menu"`;
  },
  btn() {
    return `mode="btn"`;
  }
} as const;

export const needTransformDir = [
  "if",
  "show",
  "for",
  "else",
  "else-if"
] as const;
export const needTransformProps = ["key"] as const;

function isPermissionProps(
  modifier: string
): modifier is keyof typeof hasPermissionPropsHelps {
  return (hasPermissionPropsHelps as any)[modifier] !== undefined;
}

export class BuilderHoistElementContextHelper {
  private declare bhe: BuilderHoistElement;
  constructor(bhe: BuilderHoistElement) {
    this.bhe = bhe;
  }

  findNodeDirs() {
    return this.helpFindNodeProps<DirectiveNode>(
      needTransformDir,
      this.bhe.childMs,
      this.bhe.child,
      findDir
    );
  }
  findNodeProps() {
    return this.helpFindNodeProps<AttributeNode>(
      needTransformProps,
      this.bhe.childMs,
      this.bhe.child,
      findProp
    );
  }
  normalizedFallbackSlot(hasPermission: DirectiveNode) {
    const hasFallBack = hasPermission.modifiers.find(
      (mod) => mod.content === "fallback"
    );
    if (hasFallBack) {
      return `<template #fallback>${this.getFallBackProp}</template>`;
    }
    return "";
  }
  get getFallBackProp() {
    const fallbackProp = findProp(this.bhe.child, "fallback");
    if (fallbackProp) {
      this.bhe.childMs.remove(
        fallbackProp.loc.start.offset,
        fallbackProp.loc.end.offset
      );
      //静态
      if (fallbackProp?.type === 6) {
        return fallbackProp.value?.content || "";
      }
      //动态
      if (fallbackProp?.type === 7 && fallbackProp.exp?.type === 4) {
        return `{{${fallbackProp.exp.content}}}`;
      }
    }
    return "-";
  }

  get getHasPermissionDir(): DirectiveNode {
    return findDir(this.bhe.child, "hasPermission")!;
  }

  private helpFindNodeProps<T>(
    t: readonly string[],
    childMs: MagicString,
    child: ElementNode,
    fn: typeof findDir | typeof findProp
  ): Array<T> {
    return t
      .map((prop) => {
        const maybeDir = fn(child, prop, true);
        if (maybeDir) {
          const { loc } = maybeDir;
          childMs.remove(loc.start.offset, loc.end.offset);
          return maybeDir;
        }
      })
      .filter(Boolean) as Array<T>;
  }

  static NomadizeProps(modifier: string) {
    if (isPermissionProps(modifier)) {
      return hasPermissionPropsHelps[modifier]();
    }
  }

  static SpaceSymbol = " ";
}

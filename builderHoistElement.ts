import { AttributeNode, DirectiveNode, ElementNode } from "@vue/compiler-core";
import { MagicString } from "@vue/compiler-sfc";

import { BuilderHoistElementContextHelper } from "./helper";

export class BuilderHoistElement {
  public declare child: ElementNode;
  public declare childMs: MagicString;
  private declare helperContext: BuilderHoistElementContextHelper;

  constructor(child: ElementNode, childMs: MagicString) {
    this.child = child;
    this.childMs = childMs;
    this.helperContext = new BuilderHoistElementContextHelper(this);
  }

  getBuilderNodeString() {
    const [dirs, props] = this.preHandleNodeString();
    const hoistParentString = this.builderHoistNode(dirs, props);
    return hoistParentString;
  }

  preHandleNodeString(): [Array<DirectiveNode>, Array<AttributeNode>] {
    const hasPermission = this.helperContext.getHasPermissionDir;
    this.childMs.remove(
      hasPermission!.loc.start.offset - this.child.loc.start.offset,
      hasPermission!.loc.end.offset - this.child.loc.start.offset
    );
    const dirs = this.helperContext.findNodeDirs();
    const props = this.helperContext.findNodeProps();
    return [dirs, props];
  }

  builderHoistNode(dirs: Array<DirectiveNode>, props: Array<AttributeNode>) {
    const hasPermission = this.helperContext.getHasPermissionDir;
    const dirString = dirs
      .map((dir) => dir.loc.source)
      .join(BuilderHoistElementContextHelper.SpaceSymbol);
    const propsString = props
      .map((prop) => prop.loc.source)
      .join(BuilderHoistElementContextHelper.SpaceSymbol);
    const componentProps = hasPermission.modifiers
      .map((modifier) =>
        BuilderHoistElementContextHelper.NomadizeProps(modifier.content)
      )
      .join(BuilderHoistElementContextHelper.SpaceSymbol);

    return `<HasPermission
    :permission="${hasPermission.exp?.loc.source}"
    ${componentProps} ${dirString} ${propsString} >
          ${this.childMs.toString()}
          ${this.helperContext.normalizedFallbackSlot(hasPermission)}
    </HasPermission>`;
  }
}

import {
  type IBlockDefinition,
  type BlockCreatedEvent,
  type BlockFocusedEvent,
  type BlockContentChangedEvent,
  type BlockDidMountEvent,
  type CursorDomResult,
  Block,
} from "./basic";
import { TextInputEvent } from "@pkg/view/editor";
import { BlockyTextModel, BlockElement, Delta } from "blocky-data";

export class TitleBlock extends Block {
  static Name = "Title";
  #container: HTMLElement | undefined;

  constructor(props: BlockElement) {
    super(props);
  }

  override blockContentChanged({
    changeset,
    offset,
    blockElement,
  }: BlockContentChangedEvent): void {
    if (!this.#container) {
      return;
    }
    const newDelta = new Delta([{ insert: this.#container.textContent ?? "" }]);

    const beforeDelta = this.textModel.delta;

    const diff = beforeDelta.diff(newDelta, offset);
    changeset.textEdit(this.props, "textContent", () => diff);

    // the browser will automatically insert a <br /> tag.
    // don't know why, just force update to remove it.
    if (newDelta.length() === 0) {
      changeset.forceUpdate = true;
    }

    this.editor.textInput.emit(
      new TextInputEvent(beforeDelta, diff, blockElement)
    );
  }

  override blockFocused({ cursor, selection }: BlockFocusedEvent) {
    if (!this.#container) {
      return;
    }

    const range = document.createRange();

    const firstChild = this.#container.firstChild;
    if (firstChild) {
      range.setStart(firstChild, cursor.offset);
      range.setEnd(firstChild, cursor.offset);
    } else {
      range.setStart(this.#container, 0);
      range.setEnd(this.#container, 0);
    }

    selection.addRange(range);
  }

  override getCursorDomByOffset(offset: number): CursorDomResult | undefined {
    const firstChild = this.#container?.firstChild;
    if (!firstChild) {
      return undefined;
    }
    return {
      node: firstChild,
      offset,
    };
  }

  override blockDidMount({ element }: BlockDidMountEvent): void {
    this.#container = element;
    element.setAttribute("placeholder", "Untitled document");
  }

  get textModel(): BlockyTextModel {
    return this.props.getAttribute<BlockyTextModel>("textContent")!;
  }
}

export class TitleBlockDefinition implements IBlockDefinition {
  name: string = TitleBlock.Name;
  editable = true;

  onBlockCreated({ blockElement: data }: BlockCreatedEvent): Block {
    return new TitleBlock(data);
  }
}

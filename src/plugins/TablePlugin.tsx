import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin as LexicalTablePlugin } from "@lexical/react/LexicalTablePlugin";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { Grid } from "@techstack/react-feather";
import type { LexicalEditor } from "lexical";
import { type JSX, useCallback, useContext, useEffect, useState } from "react";

import Button from "../ui/Button";
import { DialogActions } from "../ui/Dialog";
import { DropDownContext, DropDownItem } from "../ui/Dropdown";
import TextInput from "../ui/TextInput";

interface InsertTableDialogProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

const MAX_ROWS = 500;
const MAX_COLUMNS = 50;

const InsertTableDialog = ({
  activeEditor,
  onClose,
}: InsertTableDialogProps): JSX.Element => {
  const [rows, setRows] = useState("5");
  const [columns, setColumns] = useState("5");
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);

    if (
      row &&
      row > 0 &&
      row <= MAX_ROWS &&
      column &&
      column > 0 &&
      column <= MAX_COLUMNS
    ) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);

  const onClick = useCallback(() => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
    });

    onClose();
  }, [activeEditor, columns, onClose, rows]);

  return (
    <>
      <TextInput
        data-test-id="table-modal-rows"
        label="Rows"
        onChange={setRows}
        placeholder="# of rows (1-500)"
        type="number"
        value={rows}
      />
      <TextInput
        data-test-id="table-modal-columns"
        label="Columns"
        onChange={setColumns}
        placeholder="# of columns (1-50)"
        type="number"
        value={columns}
      />
      <DialogActions data-test-id="table-model-confirm-insert">
        <Button isDisabled={isDisabled} onClick={onClick}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
};

interface TablePluginProps {
  /** @internal */ showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void /** @internal */;
}

const TablePlugin = ({ showModal }: TablePluginProps) => {
  const [editor] = useLexicalComposerContext();
  const dropDownContext = useContext(DropDownContext);

  const handleShowModal = useCallback(() => {
    showModal("Insert Table", (onClose) => (
      <InsertTableDialog activeEditor={editor} onClose={onClose} />
    ));
  }, [editor, showModal]);

  return (
    <>
      <LexicalTablePlugin hasCellBackgroundColor hasCellMerge />
      {dropDownContext === undefined ? (
        <Button onClick={handleShowModal} title="table">
          <Grid size={12} />
          Table
        </Button>
      ) : (
        <DropDownItem onClick={handleShowModal} title="table">
          <Grid size={12} />
          Table
        </DropDownItem>
      )}
    </>
  );
};

export default TablePlugin;

import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import {
  StateField,
  Extension,
  Transaction,
  EditorState,
  RangeSetBuilder,
} from "@codemirror/state";

class ConflictWidget extends WidgetType {
  constructor(
    readonly from: number,
    readonly to: number,
    readonly currentFrom: number,
    readonly currentTo: number,
    readonly incomingFrom: number,
    readonly incomingTo: number,
    readonly currentName: string,
    readonly incomingName: string,
  ) {
    super();
  }

  eq(other: ConflictWidget) {
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.currentFrom === other.currentFrom &&
      this.currentTo === other.currentTo &&
      this.incomingFrom === other.incomingFrom &&
      this.incomingTo === other.incomingTo
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "cm-git-conflict-actions";
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.padding = "4px 0";
    wrap.style.marginBottom = "4px";
    wrap.style.fontFamily = "var(--font-sans)";
    wrap.style.fontSize = "12px";
    wrap.style.userSelect = "none";
    wrap.style.color = "var(--color-fg-muted)";

    const createBtn = (text: string, color: string, onClick: () => void) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.color = color;
      btn.style.cursor = "pointer";
      btn.style.padding = "2px 4px";
      btn.style.borderRadius = "4px";
      btn.style.fontWeight = "500";
      btn.style.transition = "background 0.2s";

      btn.onmouseenter = () => {
        btn.style.background = "var(--color-bg-secondary)";
      };
      btn.onmouseleave = () => {
        btn.style.background = "transparent";
      };

      btn.onclick = (e) => {
        e.preventDefault();
        onClick();
      };
      return btn;
    };

    const acceptCurrent = () => {
      const currentText = view.state.sliceDoc(this.currentFrom, this.currentTo);
      view.dispatch({
        changes: { from: this.from, to: this.to, insert: currentText },
        annotations: Transaction.userEvent.of("input"),
      });
    };

    const acceptIncoming = () => {
      const incomingText = view.state.sliceDoc(
        this.incomingFrom,
        this.incomingTo,
      );
      view.dispatch({
        changes: { from: this.from, to: this.to, insert: incomingText },
        annotations: Transaction.userEvent.of("input"),
      });
    };

    const acceptBoth = () => {
      const currentText = view.state.sliceDoc(this.currentFrom, this.currentTo);
      const incomingText = view.state.sliceDoc(
        this.incomingFrom,
        this.incomingTo,
      );
      const insert =
        currentText + (currentText && incomingText ? "\n" : "") + incomingText;
      view.dispatch({
        changes: { from: this.from, to: this.to, insert },
        annotations: Transaction.userEvent.of("input"),
      });
    };

    wrap.appendChild(
      createBtn("Accept Current Change", "var(--color-success)", acceptCurrent),
    );
    wrap.appendChild(document.createTextNode("|"));
    wrap.appendChild(
      createBtn("Accept Incoming Change", "var(--color-info)", acceptIncoming),
    );
    wrap.appendChild(document.createTextNode("|"));
    wrap.appendChild(
      createBtn("Accept Both Changes", "var(--color-fg)", acceptBoth),
    );

    return wrap;
  }
}

function buildConflictDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = state.doc;
  const lines = doc.lines;

  let inConflict = false;
  let startLine: number | null = null;
  let middleLine: number | null = null;
  let currentName = "";
  let incomingName = "";

  const currentLineDeco = Decoration.line({
    attributes: { style: "background-color: rgba(46, 160, 67, 0.1);" },
  });

  const incomingLineDeco = Decoration.line({
    attributes: { style: "background-color: rgba(56, 139, 253, 0.1);" },
  });

  const markerLineDeco = Decoration.line({
    attributes: { style: "color: var(--color-fg-muted); font-weight: bold;" },
  });

  for (let i = 1; i <= lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    if (!inConflict) {
      if (text.startsWith("<<<<<<< ")) {
        inConflict = true;
        startLine = i;
        currentName = text.slice(8).trim();
      }
    } else {
      if (text === "=======") {
        middleLine = i;
      } else if (text.startsWith(">>>>>>> ")) {
        if (startLine !== null && middleLine !== null) {
          incomingName = text.slice(8).trim();

          // We found a complete conflict block
          const endLine = i;
          const from = doc.line(startLine).from;
          const to = doc.line(endLine).to;

          const currentFrom =
            startLine < middleLine - 1
              ? doc.line(startLine + 1).from
              : doc.line(middleLine).from;
          const currentTo =
            startLine < middleLine - 1
              ? doc.line(middleLine - 1).to
              : doc.line(middleLine).from;

          const incomingFrom =
            middleLine < endLine - 1
              ? doc.line(middleLine + 1).from
              : doc.line(endLine).from;
          const incomingTo =
            middleLine < endLine - 1
              ? doc.line(endLine - 1).to
              : doc.line(endLine).from;

          // Add widget
          builder.add(
            from,
            from,
            Decoration.widget({
              widget: new ConflictWidget(
                from,
                to,
                currentFrom,
                currentTo,
                incomingFrom,
                incomingTo,
                currentName,
                incomingName,
              ),
              side: -1,
              block: true,
            }),
          );

          // Add line decos
          builder.add(
            doc.line(startLine).from,
            doc.line(startLine).from,
            markerLineDeco,
          );

          for (let l = startLine + 1; l < middleLine; l++) {
            builder.add(doc.line(l).from, doc.line(l).from, currentLineDeco);
          }

          builder.add(
            doc.line(middleLine).from,
            doc.line(middleLine).from,
            markerLineDeco,
          );

          for (let l = middleLine + 1; l < endLine; l++) {
            builder.add(doc.line(l).from, doc.line(l).from, incomingLineDeco);
          }

          builder.add(
            doc.line(endLine).from,
            doc.line(endLine).from,
            markerLineDeco,
          );
        }

        // Reset state
        inConflict = false;
        startLine = null;
        middleLine = null;
      }
    }
  }

  return builder.finish();
}

const conflictStateField = StateField.define<DecorationSet>({
  create(state) {
    return buildConflictDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged) {
      return buildConflictDecorations(tr.state);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function gitConflictExtension(): Extension {
  return [
    conflictStateField,
    EditorView.theme({
      ".cm-git-conflict-actions button:hover": {
        background: "var(--color-bg-secondary) !important",
      },
    }),
  ];
}

import { createSignal, onMount, onCleanup, createEffect, untrack } from "solid-js";

export function useFindReplace() {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isReplaceVisible, setIsReplaceVisible] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [replaceQuery, setReplaceQuery] = createSignal("");
  const [caseSensitive, setCaseSensitive] = createSignal(false);
  const [useRegex, setUseRegex] = createSignal(false);
  const [wholeWord, setWholeWord] = createSignal(false);
  const [focusTrigger, setFocusTrigger] = createSignal(0);
  const [matchCount, setMatchCount] = createSignal<number | string>(0);
  const [currentMatch, setCurrentMatch] = createSignal(0);

  function executeSearch(
    action: "findNext" | "findPrev" | "replace" | "replaceAll" | "update",
  ) {
    if (!searchQuery()) return;

    window.dispatchEvent(
      new CustomEvent("rune-search-execute", {
        detail: {
          action,
          query: searchQuery(),
          replaceWith: untrack(() => replaceQuery()),
          caseSensitive: caseSensitive(),
          regexp: useRegex(),
          wholeWord: wholeWord(),
        },
      }),
    );
  }

  function handleFind() {
    setIsVisible(true);
    setIsReplaceVisible(false);
    setFocusTrigger((f) => f + 1);
  }

  function handleReplace() {
    setIsVisible(true);
    setIsReplaceVisible(true);
    setFocusTrigger((f) => f + 1);
  }

  function handleClose() {
    setIsVisible(false);
    setMatchCount(0);
    setCurrentMatch(0);
    // Clear search highlights by dispatching empty query
    window.dispatchEvent(
      new CustomEvent("rune-search-execute", {
        detail: { action: "clear" },
      }),
    );
  }

  function handleResults(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      setMatchCount(detail.count);
      setCurrentMatch(detail.currentIndex);
    }
  }

  function handleSetQuery(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.query) {
      setSearchQuery(detail.query);
    }
  }

  onMount(() => {
    window.addEventListener("rune-editor-find", handleFind);
    window.addEventListener("rune-editor-replace", handleReplace);
    window.addEventListener("rune-search-results", handleResults);
    window.addEventListener("rune-search-set-query", handleSetQuery);
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible()) {
        handleClose();
      }
    });
  });

  onCleanup(() => {
    window.removeEventListener("rune-editor-find", handleFind);
    window.removeEventListener("rune-editor-replace", handleReplace);
    window.removeEventListener("rune-search-results", handleResults);
    window.removeEventListener("rune-search-set-query", handleSetQuery);
  });

  createEffect(() => {
    const query = searchQuery();
    const isVis = isVisible();
    caseSensitive();
    useRegex();
    wholeWord();
    
    if (isVis && query) {
      executeSearch("update");
    }
  });

  return {
    isVisible,
    isReplaceVisible,
    setIsReplaceVisible,
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    caseSensitive,
    setCaseSensitive,
    useRegex,
    setUseRegex,
    wholeWord,
    setWholeWord,
    matchCount,
    currentMatch,
    executeSearch,
    handleClose,
    focusTrigger,
  };
}

const latexCommandPattern = /\\[A-Za-z]+/;
const mathExpressionPattern = /^[A-Za-z0-9\\{}[\]().,\s+\-*/=<>!_^&:]+$/;

function looksLikeUndelimitedMath(value: string) {
  const expression = value.trim();

  return (
    expression.length > 0 &&
    !expression.includes("$") &&
    latexCommandPattern.test(expression) &&
    mathExpressionPattern.test(expression)
  );
}

function wrapExpression(value: string) {
  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? "";
  const expression = value.trim();

  return looksLikeUndelimitedMath(expression)
    ? `${leadingWhitespace}$${expression}$${trailingWhitespace}`
    : value;
}

function normalizeUndelimitedMath(line: string) {
  const withParenthesizedMath = line.replace(
    /\([^()\n]*\\[A-Za-z]+[^()\n]*\)/g,
    (expression) => (looksLikeUndelimitedMath(expression) ? `$${expression}$` : expression),
  );

  if (withParenthesizedMath.includes("|")) {
    return withParenthesizedMath
      .split("|")
      .map((cell) => wrapExpression(cell))
      .join("|");
  }

  return wrapExpression(withParenthesizedMath);
}

/**
 * Normalize the common math formats produced by AI tools and document apps.
 * Besides standard LaTeX delimiters, copied content may lose its delimiters
 * and leave expressions such as `(\neg p)` or `p \to q` in Markdown tables.
 */
export function normalizeMarkdownMath(content: string) {
  const withStandardDelimiters = content
    .split(/(`+[^`]*`+)/g)
    .map((segment, index) =>
      index % 2 === 1
        ? segment
        : segment
            .replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula: string) => `\n$$\n${formula.trim()}\n$$\n`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula: string) => `$${formula.trim()}$`),
    )
    .join("");

  let insideDisplayMath = false;

  return withStandardDelimiters
    .split("\n")
    .map((line) => {
      const displayDelimiterCount = line.match(/\$\$/g)?.length ?? 0;

      if (insideDisplayMath || displayDelimiterCount > 0 || line.includes("$")) {
        if (displayDelimiterCount % 2 === 1) {
          insideDisplayMath = !insideDisplayMath;
        }

        return line;
      }

      return line
        .split(/(`+[^`]*`+)/g)
        .map((segment, index) => (index % 2 === 1 ? segment : normalizeUndelimitedMath(segment)))
        .join("");
    })
    .join("\n");
}

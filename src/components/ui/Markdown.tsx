"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export function Markdown({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={[
          "p", "br", "strong", "em", "del", "code", "pre",
          "h1", "h2", "h3", "h4", "h5", "h6",
          "ul", "ol", "li", "blockquote",
          "table", "thead", "tbody", "tr", "th", "td",
          "a", "hr", "sup", "sub",
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

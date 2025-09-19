import { useState, useMemo } from "react";

// Comprehensive MDX-like renderer for markdown content
const MDXRenderer = ({ content }) => {
  const [collapsedSections, setCollapsedSections] = useState({});

 const parseInlineMarkdown = (text) => {
    if (!text) return text;

    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">$1</code>');
    
    // Handle links (basic)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert back to JSX elements
    return (
      <span
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const toggleCollapse = (index) => {
    setCollapsedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const parseMarkdown = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let currentSection = null;
    let currentContent = [];
    let listItems = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 mb-6 ml-6">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed text-gray-800">{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="mb-6">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      }
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.replace('```', '').trim();
        } else {
          inCodeBlock = false;
          flushCodeBlock();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        flushList();
        const title = line.replace('# ', '').trim();
        elements.push(
          <h1 key={`h1-${index}`} className="text-4xl font-bold mb-8 text-gray-800 flex items-center gap-3">
            {title}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        const title = line.replace('## ', '').trim();
        elements.push(
          <h2 key={`h2-${index}`} className="text-3xl font-semibold mb-6 text-gray-800 border-b-2 border-gray-200 pb-2">
            {title}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushList();
        const title = line.replace('### ', '').trim();
        elements.push(
          <h3 key={`h3-${index}`} className="text-2xl font-semibold mb-4 text-gray-800">
            {title}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushList();
        const title = line.replace('#### ', '').trim();
        elements.push(
          <h4 key={`h4-${index}`} className="text-xl font-semibold mb-3 text-gray-700">
            {title}
          </h4>
        );
      }
      // Handle blockquotes
      else if (line.startsWith('> ')) {
        flushList();
        const content = line.replace('> ', '').trim();
        elements.push(
          <blockquote key={`quote-${index}`} className="border-l-4 border-blue-400 bg-blue-50 p-4 mb-6 rounded-r-lg">
            <p className="text-blue-800 font-medium">{parseInlineMarkdown(content)}</p>
          </blockquote>
        );
      }
      // Handle horizontal rules
      else if (line.trim() === '---') {
        flushList();
        elements.push(
          <hr key={`hr-${index}`} className="my-8 border-t-2 border-gray-200" />
        );
      }
      // Handle bullet points
      else if (line.match(/^[\s]*[-*+•]\s+/)) {
        const content = line.replace(/^[\s]*[-*+•]\s+/, '').trim();
        listItems.push(parseInlineMarkdown(content));
      }
      // Handle numbered lists
      else if (line.match(/^\d+\.\s+/)) {
        flushList();
        const content = line.replace(/^\d+\.\s+/, '').trim();
        const number = line.match(/^(\d+)\./)[1];
        elements.push(
          <div key={`numbered-${index}`} className="flex items-start gap-3 mb-3">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {number}
            </span>
            <span className="leading-relaxed text-gray-800">{parseInlineMarkdown(content)}</span>
          </div>
        );
      }
      // Handle collapsible details
      else if (line.startsWith('<details>')) {
        flushList();
        // This would need more complex parsing for full details support
      }
      // Handle inline code
      else if (line.includes('`') && !line.startsWith('```')) {
        flushList();
        elements.push(
          <p key={`para-${index}`} className="mb-4 leading-relaxed text-gray-800">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
      // Handle regular paragraphs
      else if (line.trim()) {
        flushList();
        elements.push(
          <p key={`para-${index}`} className="mb-4 leading-relaxed text-gray-800">
            {parseInlineMarkdown(line.trim())}
          </p>
        );
      }
      // Handle empty lines
      else if (line.trim() === '') {
        flushList();
        // Add some spacing for empty lines between sections
      }
    });

    // Flush any remaining items
    flushList();
    flushCodeBlock();

    return elements;
  }, [content]);

  

  return (
    <div className="prose prose-lg max-w-none">
      <div className="space-y-1">
        {parseMarkdown}
      </div>
    </div>
  );
};

export default MDXRenderer;
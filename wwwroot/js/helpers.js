function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('cs-CZ') : '-';
}

function formatJson(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch (e) {
    return str;
  }
}

function formatXml(xml) {
  if (!xml) return '';
  // Remove existing whitespace between tags to normalize
  const cleanXml = xml.replace(/>\s+</g, '><').trim();
  let formatted = '';
  let indent = 0;
  // Split into tags and text content
  const nodes = cleanXml.split(/(<[^>]+>)/g).filter(n => n !== '');
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.startsWith('<?') || node.startsWith('<!')) {
      // Header/Comment - No change in indent
      formatted += '  '.repeat(indent) + node + '\n';
    } else if (node.startsWith('</')) {
      // Closing tag - Decrease indent
      indent = Math.max(0, indent - 1);
      formatted += '  '.repeat(indent) + node + '\n';
    } else if (node.startsWith('<') && !node.endsWith('/>')) {
      // Opening tag
      const tagName = node.match(/^<([\w:.-]+)/)?.[1];
      const nextNode = nodes[i + 1];
      const nextNextNode = nodes[i + 2];
      
      if (nextNode && !nextNode.startsWith('<') && nextNextNode === `</${tagName}>`) {
        // Simple element with text content: <tag>content</tag>
        formatted += '  '.repeat(indent) + node + nextNode + nextNextNode + '\n';
        i += 2;
      } else if (nextNode === `</${tagName}>`) {
        // Empty element: <tag></tag>
        formatted += '  '.repeat(indent) + node + nextNode + '\n';
        i += 1;
      } else {
        // Opening tag with children
        formatted += '  '.repeat(indent) + node + '\n';
        indent++;
      }
    } else if (node.startsWith('<') && node.endsWith('/>')) {
      // Self-closing tag
      formatted += '  '.repeat(indent) + node + '\n';
    } else {
      // Text content that wasn't handled by the simple element logic above
      formatted += '  '.repeat(indent) + node + '\n';
    }
  }
  return formatted.trim();
}

function formatContent(content, fileName) {
  if (!content) return '';
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'json') return formatJson(content);
  const xmlExts = ['xml', 'html', 'xaml', 'config', 'csproj', 'vbproj', 'resx'];
  if (xmlExts.includes(ext)) return formatXml(content);
  return content;
}ote

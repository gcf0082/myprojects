class SearchReport {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = null;
    this.contextLines = 0; // 默认不显示上下文
    this.initControls();
  }

  initControls() {
    const controls = document.createElement('div');
    controls.className = 'controls';

    // 路径过滤
    const pathFilterContainer = document.createElement('div');
    pathFilterContainer.className = 'filter-container';

    const pathLabel = document.createElement('label');
    pathLabel.textContent = '路径过滤：';
    pathLabel.htmlFor = 'path-filter';

    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.id = 'path-filter';
    pathInput.placeholder = '输入路径关键词';

    pathFilterContainer.appendChild(pathLabel);
    pathFilterContainer.appendChild(pathInput);

    // 上下文行数
    const contextContainer = document.createElement('div');
    contextContainer.className = 'filter-container';

    const contextLabel = document.createElement('label');
    contextLabel.textContent = '上下文行数：';
    contextLabel.htmlFor = 'context-lines';

    const contextInput = document.createElement('input');
    contextInput.type = 'number';
    contextInput.id = 'context-lines';
    contextInput.min = 0;
    contextInput.max = 10;
    contextInput.value = this.contextLines;

    const applyButton = document.createElement('button');
    applyButton.textContent = '应用';
    applyButton.addEventListener('click', () => {
      this.contextLines = parseInt(contextInput.value);
      this.render();
    });

    contextContainer.appendChild(contextLabel);
    contextContainer.appendChild(contextInput);
    contextContainer.appendChild(applyButton);

    controls.appendChild(pathFilterContainer);
    controls.appendChild(contextContainer);
    this.container.before(controls);

    // 实时过滤
    pathInput.addEventListener('input', () => {
      this.render();
    });
  }

  async loadData(url = 'sample-data.json') {
    try {
      const response = await fetch(url);
      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async render() {
    if (!this.data) return;

    this.container.innerHTML = '';

    // 获取路径过滤关键词
    const filterText = document.getElementById('path-filter').value.toLowerCase();

    for (const file of this.data) {
      // 过滤文件路径
      if (filterText && !file.path.toLowerCase().includes(filterText)) {
        continue;
      }

      const fileSection = document.createElement('div');
      fileSection.className = 'file-section';

      const header = this.createFileHeader(file);
      const content = await this.createFileContent(file);

      fileSection.appendChild(header);
      fileSection.appendChild(content);
      this.container.appendChild(fileSection);
    }
  }

  createFileHeader(file) {
    const header = document.createElement('div');
    header.className = 'file-header';

    const path = document.createElement('div');
    path.className = 'file-path';
    path.textContent = file.path;

    const count = document.createElement('div');
    count.className = 'match-count';
    count.textContent = `${file.matches.length}处匹配`;

    header.appendChild(path);
    header.appendChild(count);

    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });

    return header;
  }

  async getFileContent(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error('File not found');
      return await response.text();
    } catch (error) {
      console.error('Error loading file:', error);
      return null;
    }
  }

  async createFileContent(file) {
    const content = document.createElement('div');
    content.className = 'match-content';

    // 默认模式，不获取文件内容
    if (this.contextLines === 0) {
      file.matches.forEach(match => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'match-line match-line-highlight';
        
        const lineNumber = document.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = `第${match.line}行: `;
        lineDiv.appendChild(lineNumber);

        lineDiv.appendChild(this.highlightText(match.text, match.highlights));
        
        // 添加双击事件
        lineDiv.addEventListener('dblclick', () => {
          this.sendLineData(file.path, match);
        });
        
        content.appendChild(lineDiv);
      });
      return content;
    }

    // 获取文件内容显示上下文
    const fileContent = await this.getFileContent(file.path);
    if (!fileContent) return content;

    const lines = fileContent.split('\n');

    // 合并重叠的匹配范围
    const mergedRanges = this.mergeMatchRanges(file.matches);

    for (const range of mergedRanges) {
      const startLine = Math.max(1, range.start - this.contextLines);
      const endLine = Math.min(lines.length, range.end + this.contextLines);

      for (let i = startLine; i <= endLine; i++) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'match-line';
        
        const lineNumber = document.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = `第${i}行: `;
        lineDiv.appendChild(lineNumber);

        const lineText = lines[i - 1];
        
        // 检查当前行是否是匹配行
        const match = range.matches.find(m => m.line === i);
        if (match) {
          lineDiv.appendChild(this.highlightText(lineText, match.highlights));
          lineDiv.classList.add('match-line-highlight');
        } else {
          lineDiv.appendChild(document.createTextNode(lineText));
        }
        
        // 为所有行添加双击事件
        lineDiv.addEventListener('dblclick', () => {
          this.sendLineData(file.path, {
            line: i,
            text: lineText,
            highlights: match ? match.highlights : []
          });
        });

        content.appendChild(lineDiv);
      }

      const separator = document.createElement('div');
      separator.className = 'match-separator';
      content.appendChild(separator);
    }

    return content;
  }

  mergeMatchRanges(matches) {
    if (matches.length === 0) return [];

    // 按行号排序
    const sortedMatches = matches.slice().sort((a, b) => a.line - b.line);
    const ranges = [];

    let currentRange = {
      start: sortedMatches[0].line,
      end: sortedMatches[0].line,
      matches: [sortedMatches[0]]
    };

    for (let i = 1; i < sortedMatches.length; i++) {
      const match = sortedMatches[i];
      // 如果当前匹配行与上一个范围重叠（考虑上下文）
      if (match.line - this.contextLines <= currentRange.end + this.contextLines) {
        currentRange.end = Math.max(currentRange.end, match.line);
        currentRange.matches.push(match);
      } else {
        ranges.push(currentRange);
        currentRange = {
          start: match.line,
          end: match.line,
          matches: [match]
        };
      }
    }

    // 添加最后一个范围
    ranges.push(currentRange);
    return ranges;
  }

  highlightText(text, highlights) {
    const span = document.createElement('span');
    let lastIndex = 0;
    
    highlights.sort((a, b) => a.start - b.start).forEach(hl => {
      // 添加高亮前的文本
      if (hl.start > lastIndex) {
        span.appendChild(document.createTextNode(
          text.slice(lastIndex, hl.start)
        ));
      }

      // 添加高亮文本
      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'highlight';
      highlightSpan.textContent = text.slice(hl.start, hl.end);
      span.appendChild(highlightSpan);

      lastIndex = hl.end;
    });

    // 添加剩余文本
    if (lastIndex < text.length) {
      span.appendChild(document.createTextNode(
        text.slice(lastIndex)
      ));
    }

    return span;
  }

  sendLineData(filePath, match) {
    const params = new URLSearchParams({
      file: filePath,
      line: match.line,
      text: match.text,
      highlights: JSON.stringify(match.highlights)
    });

    fetch(`/api/log-line?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Line data sent successfully:', data);
      })
      .catch(error => {
        console.error('Error sending line data:', error);
      });
  }
}

// 初始化并加载数据
const report = new SearchReport('report-container');
report.loadData();

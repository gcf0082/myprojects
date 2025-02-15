document.addEventListener('DOMContentLoaded', function() {
    let allFiles = [];
    const filterInput = document.getElementById('filter-input');
    const filterType = document.getElementById('filter-type');
    
    // 初始化过滤功能
    filterInput.addEventListener('input', () => {
        renderDiff(allFiles);
    });
    filterType.addEventListener('change', () => {
        renderDiff(allFiles);
    });

    // 加载并显示差异
    fetch('diff.json')
        .then(response => response.json())
        .then(data => {
            allFiles = data.files;
            renderDiff(allFiles);
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('.diff-content').innerHTML = '<div class="error">无法加载差异信息</div>';
        });

    function renderDiff(files) {
        const diffContent = document.querySelector('.diff-content');
        const filterText = filterInput.value.toLowerCase();
        const selectedTypes = Array.from(filterType.selectedOptions)
            .map(option => option.value);
        
        // 清空内容
        document.querySelectorAll('.category-content').forEach(el => el.innerHTML = '');

        // 过滤文件
        const filteredFiles = files.filter(file => {
            // 按类型过滤
            if (selectedTypes.length > 0 && !selectedTypes.includes(file.status)) {
                return false;
            }
            // 按路径过滤
            const path = file.filename || '';
            return path.toLowerCase().includes(filterText);
        });

        // 按状态分类渲染文件
        filteredFiles.forEach(file => {
            const status = file.status;
            const row = createFileRow(file);
            
            diffContent.querySelector(`.category[data-status="${status}"] .category-content`)
                .appendChild(row);
        });

        // 添加折叠功能
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                header.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        });

        // 默认折叠未改变文件
        const unchangedHeaders = document.querySelectorAll('.category[data-status="unchanged"] .category-header');
        unchangedHeaders.forEach(header => {
            header.classList.add('collapsed');
            header.nextElementSibling.classList.add('collapsed');
        });
    }

    function createFileRow(file) {
        const row = document.createElement('div');
        row.className = `file-info status-${file.status}`;

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.filename;
        fileName.style.cursor = 'pointer';
        fileName.addEventListener('click', () => {
            try {
                const path = file.filename;
                if (!path) {
                    throw new Error('文件名不存在');
                }
                fetch(`/open-file?filename=${encodeURIComponent(path)}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('无法打开文件');
                        }
                    })
                    .catch(error => {
                        console.error('打开文件失败:', error);
                        alert(error.message);
                    });
            } catch (error) {
                console.error('获取文件路径失败:', error);
                alert('无法获取文件路径');
            }
        });
        row.appendChild(fileName);

        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-details';
        
        const metaItems = [];
        if (file.last_modified) {
            metaItems.push(`最后修改: ${formatTime(file.last_modified)}`);
        }
        if (file.size) {
            metaItems.push(`大小: ${formatSize(file.size)}`);
        }
        if (file.permissions) {
            metaItems.push(`权限: ${file.permissions}`);
        }
        if (file.owner) {
            metaItems.push(`属主: ${file.owner}`);
        }

        const meta = document.createElement('div');
        meta.className = 'file-meta';
        meta.textContent = metaItems.join(' | ');
        fileDetails.appendChild(meta);

        row.appendChild(fileDetails);
        return row;
    }

    function formatTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function formatSize(bytes) {
        if (!bytes) return '';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
});

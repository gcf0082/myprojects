// 构建树形结构
function buildTree(calls) {
    const nodeMap = {};
    
    // 首先创建所有节点
    calls.forEach(call => {
        if (!nodeMap[call.caller]) {
            nodeMap[call.caller] = {name: call.caller, children: [], line: call.line};
        }
        if (!nodeMap[call.callee]) {
            nodeMap[call.callee] = {name: call.callee, children: [], line: call.line};
        }
    });
    
    // 构建调用关系
    calls.forEach(call => {
        // 避免重复添加子节点
        if (!nodeMap[call.caller].children.some(child => child.name === call.callee)) {
            nodeMap[call.caller].children.push({
                ...nodeMap[call.callee],
                line: call.line // 存储调用发生的行号
            });
        }
    });
    
    // 找出所有根节点（没有作为callee出现的caller）
    const callees = new Set(calls.map(call => call.callee));
    const rootMap = new Map();
    
    calls.forEach(call => {
        if (!callees.has(call.caller)) {
            const rootName = call.caller;
            if (!rootMap.has(rootName)) {
                rootMap.set(rootName, nodeMap[rootName]);
            } else {
                // 合并相同根节点的children
                const existingRoot = rootMap.get(rootName);
                nodeMap[rootName].children.forEach(child => {
                    if (!existingRoot.children.some(c => c.name === child.name)) {
                        existingRoot.children.push(child);
                    }
                });
            }
        }
    });
    
    const roots = Array.from(rootMap.values());
    return roots.length > 1 ? 
        {name: "Roots", children: roots} : 
        roots[0] || {name: "Empty", children: []};
}

// 创建树节点
function createTreeNode(nodeData) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.setAttribute('data-name', nodeData.name);

    const content = document.createElement('div');
    content.className = 'node-content';
    
    if (nodeData.children && nodeData.children.length > 0) {
        const toggle = document.createElement('span');
        toggle.className = 'toggle';
        toggle.textContent = '▶';
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.textContent = this.textContent === '▶' ? '▼' : '▶';
            this.parentNode.nextElementSibling.classList.toggle('expanded');
        });
        content.appendChild(toggle);
    }

    const name = document.createElement('span');
    name.className = 'node-name';
    name.textContent = `${nodeData.name} (line: ${nodeData.line})`;
    name.setAttribute('data-fullname', nodeData.name);
    
    // 添加双击事件
    content.addEventListener('dblclick', function() {
        // 显示调用信息
        if (nodeData.line) {
            // 获取父节点作为caller
            const parentNode = $(this).closest('.tree-node').parent().closest('.tree-node');
            const caller = parentNode.length ? 
                parentNode.find('.node-name').attr('data-fullname') : 
                nodeData.name;
            
            const url = `/api/call-info?caller=${encodeURIComponent(caller)}&callee=${encodeURIComponent(nodeData.name)}&line=${nodeData.line}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    $('#info-function').text(nodeData.name);
                    $('#info-line').text(nodeData.line);
                    $('#info-details').text(JSON.stringify(data, null, 2));
                })
                .catch(error => {
                    console.error('Error fetching call info:', error);
                    $('#info-function').text(nodeData.name);
                    $('#info-line').text(nodeData.line);
                    $('#info-details').text('无法获取调用详情');
                });
        } else {
            $('#info-function').text(nodeData.name);
            $('#info-line').text('未知');
            $('#info-details').text('无调用详情');
        }
    });
    
    // 根据关键字设置颜色
    if (nodeData.name.includes('main')) {
        name.classList.add('red');
    } else if (nodeData.name.includes('init')) {
        name.classList.add('blue');
    } else if (nodeData.name.includes('handle')) {
        name.classList.add('green');
    } else if (nodeData.name.includes('process')) {
        name.classList.add('yellow');
    } else if (nodeData.name.includes('render')) {
        name.classList.add('purple');
    }
    content.appendChild(name);

    // 添加右键点击事件
    content.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        selectedNode = node;
        showContextMenu(e);
    });

    node.appendChild(content);

    if (nodeData.children && nodeData.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        nodeData.children.forEach(child => {
            childrenContainer.appendChild(createTreeNode(child));
        });
        node.appendChild(childrenContainer);
    }

    return node;
}

// 显示右键菜单
function showContextMenu(e) {
    const menu = $('#contextMenu');
    menu.css({
        display: 'block',
        position: 'absolute',
        left: e.pageX + 'px',
        top: e.pageY + 'px'
    });
    contextMenuVisible = true;
}

// 隐藏右键菜单
function hideContextMenu() {
    if (contextMenuVisible) {
        $('#contextMenu').hide();
        contextMenuVisible = false;
    }
}

// 复制函数名到剪贴板
function copyFunctionName() {
    if (selectedNode) {
        navigator.clipboard.writeText(selectedNode.querySelector('.node-name').textContent)
            .then(() => {
                console.log('函数名已复制:', selectedNode.querySelector('.node-name').textContent);
            })
            .catch(err => {
                console.error('复制失败:', err);
            });
    }
}

// 全部展开功能
function expandAllNodes(node) {
    const toggle = node.querySelector('.toggle');
    if (toggle && toggle.textContent === '▶') {
        toggle.click();
    }
    
    const children = node.querySelector('.children');
    if (children) {
        children.classList.add('expanded');
        const childNodes = children.querySelectorAll('.tree-node');
        childNodes.forEach(child => expandAllNodes(child));
    }
}

// 全部折叠功能
function collapseAllNodes(node) {
    const toggle = node.querySelector('.toggle');
    if (toggle && toggle.textContent === '▼') {
        toggle.click();
    }
    
    const children = node.querySelector('.children');
    if (children) {
        children.classList.remove('expanded');
        const childNodes = children.querySelectorAll('.tree-node');
        childNodes.forEach(child => collapseAllNodes(child));
    }
}

// 初始化右键菜单事件
function initContextMenu() {
    // 点击其他地方隐藏菜单
    $(document).on('click', hideContextMenu);
    
    // 绑定复制功能
    $('#copyFunctionName').on('click', function() {
        copyFunctionName();
        hideContextMenu();
    });

    // 绑定全部展开功能
    $('#expandAll').on('click', function() {
        if (selectedNode) {
            expandAllNodes(selectedNode);
        }
        hideContextMenu();
    });

    // 绑定全部折叠功能
    $('#collapseAll').on('click', function() {
        if (selectedNode) {
            collapseAllNodes(selectedNode);
        }
        hideContextMenu();
    });
}

// 搜索功能
function searchFunction(query) {
    // 清除之前的高亮
    $('.node-name').removeClass('highlight');
    
    // 查找匹配的节点
    const matches = $(`.node-name[data-fullname*="${query}"]`);
    if (matches.length > 0) {
        matches.addClass('highlight');
        
        // 展开所有匹配节点的父节点
        matches.each(function() {
            let parent = $(this).closest('.tree-node');
            const parentsToExpand = [];
            
            // 先收集所有需要展开的父节点
            while (parent.length > 0) {
                const toggle = parent.find('.toggle');
                if (toggle.length > 0 && toggle.text() === '▶') {
                    parentsToExpand.push(parent);
                }
                parent = parent.parent().closest('.tree-node');
            }
            
            // 从最外层向里层依次展开
            const expandParents = async () => {
                for (let i = parentsToExpand.length - 1; i >= 0; i--) {
                    const parent = parentsToExpand[i];
                    const toggle = parent.find('.toggle');
                    if (toggle.text() === '▶') {
                        toggle.click();
                        // 等待动画完成
                        await new Promise(resolve => {
                            parent.find('.children').on('transitionend', resolve, {once: true});
                        });
                    }
                }
            };
            
            expandParents();
        });
        
        // 滚动到第一个匹配项
        matches[0].scrollIntoView({behavior: 'smooth', block: 'center'});
    }
}

// 初始化搜索功能
function initSearch() {
    $('#searchButton').on('click', function() {
        const query = $('#searchInput').val().trim();
        if (query) {
            searchFunction(query);
        }
    });
    
    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            const query = $('#searchInput').val().trim();
            if (query) {
                searchFunction(query);
            }
        }
    });
}

// 加载并初始化树结构
function initTree() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tree = buildTree(data.calls);
            const container = document.getElementById('tree-container');
            // 如果是多根节点，直接渲染children
            if (tree.name === "Roots") {
                tree.children.forEach(root => {
                    container.appendChild(createTreeNode(root));
                });
            } else {
                container.appendChild(createTreeNode(tree));
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            const container = document.getElementById('tree-container');
            container.textContent = 'Error loading function call data';
        });
}

// 页面加载完成后初始化
$(document).ready(function() {
    initTree();
    initContextMenu();
    initSearch();
});

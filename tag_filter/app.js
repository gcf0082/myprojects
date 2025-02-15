// 获取DOM元素
const tagContainer = document.getElementById('tags');
const modelContainer = document.getElementById('models');

// 收集所有标签并去重
const allTags = [...new Set(modelData.flatMap(model => model.tags))];

// 初始化选择的标签
let selectedTags = [];

// 渲染标签按钮
function renderTags() {
    tagContainer.innerHTML = allTags.map(tag => `
        <div class="tag ${selectedTags.includes(tag) ? 'active' : ''}">
            ${tag}
        </div>
    `).join('');
    
    // 添加点击事件
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagName = tag.innerText;
            if (selectedTags.includes(tagName)) {
                selectedTags = selectedTags.filter(t => t !== tagName);
            } else {
                selectedTags.push(tagName);
            }
            tag.classList.toggle('active');
            renderModels();
        });
    });
}

// 渲染模型列表
function renderModels() {
    const filteredModels = selectedTags.length === 0 
        ? modelData 
        : modelData.filter(model => 
            selectedTags.every(tag => 
                model.tags.includes(tag)
            )
        );

    modelContainer.innerHTML = filteredModels.map(model => `
        <div class="model-card">
            <div class="model-name">${model.name}</div>
            <div class="model-description">${model.description}</div>
            <div class="model-meta">
                <span>作者: ${model.author}</span>
                <span>下载量: ${model.downloads}</span>
            </div>
            <div class="model-tags">
                ${model.tags.map(tag => `
                    <div class="model-tag">${tag}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 初始化
renderTags();
renderModels();

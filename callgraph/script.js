// 将JSON数据转换为DOT格式
function jsonToDot(data) {
  let dot = 'digraph G {\n';
  
  // 添加所有节点
  data.nodes.forEach(node => {
    dot += `  "${node}" [label="${node}", shape="box"];\n`;
  });
  
  // 添加所有边
  data.links.forEach(link => {
    dot += `  "${link.source}" -> "${link.target}" [id="edge_${link.source}_${link.target}", class="call-edge"];\n`;
  });
  
  dot += '}';
  return dot;
}

// 处理边点击事件
function handleEdgeClick(line) {
  fetch(`/jump?line=${line}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Jump request successful:', data);
    })
    .catch(error => {
      console.error('Error sending jump request:', error);
    });
}

// 加载数据并渲染图形
d3.json('data.json').then(data => {
  const dot = jsonToDot(data);
  
  d3.select('#graph')
    .graphviz()
    .renderDot(dot)
    .on('end', () => {
      console.log('Graph rendered');
      
      // 绑定边点击事件
      d3.selectAll('.call-edge')
        .on('click', function(event) {
          const edgeId = d3.select(this).attr('id');
          const link = data.links.find(link => 
            `edge_${link.source}_${link.target}` === edgeId
          );
          if (link) {
            handleEdgeClick(link.line);
          }
        });
    });
}).catch(error => {
  console.error('Error loading data:', error);
});

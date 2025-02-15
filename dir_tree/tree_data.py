import os

UPLOAD_FOLDER = 'static/uploads'

def get_tree_data(root_path):
    tree_data = []
    for root, dirs, files in os.walk(root_path):
        for name in dirs:
            dir_path = os.path.join(root, name)
            dir_id = os.path.relpath(dir_path, root_path).replace("\\", "/")
            parent_id = os.path.relpath(root, root_path).replace("\\", "/")
            tree_data.append({
                "id": dir_id,
                "parent": parent_id if parent_id != '.' else "#",
                "text": name,
                "type": "default"
            })
        for name in files:
            file_path = os.path.join(root, name)
            file_id = os.path.relpath(file_path, root_path).replace("\\", "/")
            parent_id = os.path.relpath(root, root_path).replace("\\", "/")
            tree_data.append({
                "id": file_id,
                "parent": parent_id if parent_id != '.' else "#",
                "text": name,
                "type": "file"
            })
    return tree_data

def create_item(item_type, parent, name):
    parent_path = os.path.join(UPLOAD_FOLDER, parent)
    item_path = os.path.join(parent_path, name)
    if item_type == "file":
        open(item_path, 'w').close()
    else:
        os.makedirs(item_path, exist_ok=True)

def rename_item(item_id, new_name):
    item_path = os.path.join(UPLOAD_FOLDER, item_id)
    new_path = os.path.join(os.path.dirname(item_path), new_name)
    os.rename(item_path, new_path)

def delete_item(item_id):
    item_path = os.path.join(UPLOAD_FOLDER, item_id)
    if os.path.isfile(item_path):
        os.remove(item_path)
    else:
        for root, dirs, files in os.walk(item_path, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir(item_path)

def get_file_content(item_id):
    file_path = os.path.join(UPLOAD_FOLDER, item_id)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        with open(file_path, 'r') as f:
            return f.read()
    return ''

def save_file_content(item_id, content):
    file_path = os.path.join(UPLOAD_FOLDER, item_id)
    with open(file_path, 'w') as f:
        f.write(content)

def upload_files(parent, files, upload_folder):
    print('upload', files)
    parent_path = os.path.join(upload_folder, parent)
    os.makedirs(parent_path, exist_ok=True)
    for file in files:
        file.save(os.path.join(parent_path, file.filename))
        #create_item('file', parent, file.filename)

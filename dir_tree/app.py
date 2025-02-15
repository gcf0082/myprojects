from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import json
from tree_data import get_tree_data, create_item, rename_item, delete_item, get_file_content, save_file_content, upload_files

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tree', methods=['GET'])
def api_tree():
    tree_data = get_tree_data(app.config['UPLOAD_FOLDER'])
    return jsonify(tree_data)

@app.route('/api/create', methods=['POST'])
def api_create():
    data = request.json
    item_type = data.get('type')
    parent = data.get('parent')
    name = data.get('name')
    create_item(item_type, parent, name)
    return '', 200

@app.route('/api/rename', methods=['POST'])
def api_rename():
    data = request.json
    item_id = data.get('id')
    new_name = data.get('name')
    rename_item(item_id, new_name)
    return '', 200

@app.route('/api/delete', methods=['POST'])
def api_delete():
    data = request.json
    item_id = data.get('id')
    delete_item(item_id)
    return '', 200

@app.route('/api/content', methods=['GET'])
def api_content():
    item_id = request.args.get('id')
    content = get_file_content(item_id)
    return jsonify({'content': content})

@app.route('/api/save', methods=['POST'])
def api_save():
    data = request.json
    item_id = data.get('id')
    content = data.get('content')
    save_file_content(item_id, content)
    return '', 200

@app.route('/api/upload', methods=['POST'])
def api_upload():
    parent = request.form.get('parent')
    files = request.files.getlist('files[]')
    upload_files(parent, files, app.config['UPLOAD_FOLDER'])
    return '', 200

if __name__ == '__main__':
    app.run(debug=True)

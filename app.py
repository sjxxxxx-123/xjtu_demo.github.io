#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XJTU 本科模拟器 - Gradio Web 应用
从环境变量加载 API Key
"""

import os
import json
from pathlib import Path
import gradio as gr

# 从环境变量读取 API Key
MODELSCOPE_KEY = os.getenv('MODELSCOPE_KEY', '')

def create_html_interface():
    """创建HTML界面"""
    html_path = Path(__file__).parent / 'index.html'
    
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    else:
        html_content = """
        <div style="text-align: center; padding: 50px;">
            <h1>XJTU 本科模拟器</h1>
            <p>应用加载中...</p>
        </div>
        """
    
    # 将环境变量注入到HTML中
    html_with_config = html_content.replace(
        '</head>',
        f'<script>window.__MODELSCOPE_KEY__ = "{MODELSCOPE_KEY}";</script>\n</head>'
    )
    
    return html_with_config

def get_config():
    """获取应用配置"""
    return {
        "status": "ok",
        "api_key_configured": bool(MODELSCOPE_KEY),
        "version": "1.0"
    }

# 创建 Gradio 应用
with gr.Blocks(title="XJTU 本科模拟器") as demo:
    gr.HTML(create_html_interface())

if __name__ == "__main__":
    # 启动服务器，监听 0.0.0.0:7860
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        show_api=True
    )

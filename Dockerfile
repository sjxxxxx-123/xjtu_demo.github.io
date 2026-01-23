FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10
WORKDIR /home/user/app
COPY ./ /home/user/app
RUN pip install gradio

# 暴露端口
EXPOSE 7860

# 从环境变量读取 MODELSCOPE_KEY
ENV MODELSCOPE_KEY=""

ENTRYPOINT ["python", "-u", "app.py"]

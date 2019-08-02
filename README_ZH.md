#编译镜像
docker build . -t 192.168.92.139:5000/pase/helm-web-api:v1.0

#推送镜像仓库
docker push  192.168.92.139:5000/pase/helm-web-api:v1.0

#打包chart
cd helm-web-api/chart
helm  package on-demand-micro-services-deployment

#安装helm-api
helm install on-demand-micro-services-deployment -n helm-service --namespace=default


#访问helm

#上传包
curl   http://helm-service-on-demand-micro-services-deployment.default.svc:4000/push -F "chartPackage=@/opt/helm/helm-web-api/chart/on-demand-micro-services-deployment-0.3.0.tgz"

#install
curl -H "Content-Type: application/json" -X POST  --data '{"chartName":"pase/tomcat","releaseName":"haha","namespace":"helm-proj"}'   http://helm-service-on-demand-micro-services-deployment.default.svc:4000/install

#删除
curl  http://helm-service-on-demand-micro-services-deployment.default.svc:4000/delete -d "releaseName=haha"

curl   http://helm-service-on-demand-micro-services-deployment.default.svc:4000/search
curl   http://helm-service-on-demand-micro-services-deployment.default.svc:4000/list
curl   http://helm-service-on-demand-micro-services-deployment.default.svc:4000/repolist


对应用的分类：
 helm inspect values pase/on-demand-micro-services-deployment
放在values中
chartType: 应用大类-企划、人事
chartSubType: 应用小类-企划、人事
tenant： 租户

是放在values中还是表中？ 待商榷


镜像不能放在各个租户的的分区，应该放入公共分区，用表存储辅助信息。
放在租户分区，会导致镜像和租户绑定，导致chart无法编排。


使用镜像启动chartmuseum作为仓库
docker run --rm -d \
  -p 8879:8080 \
  -v $(pwd)/charts:/charts \
  --privileged=true  \
  -e DEBUG=true \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  chartmuseum/chartmuseum
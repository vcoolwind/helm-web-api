const express = require('express');
const bodyParser = require('body-parser');
const Helm = require('./on-demand-micro-services-deployment-k8s/helm');
const PortsAllocator = require('./on-demand-micro-services-deployment-k8s/ports-allocator');
const IngressManager = require('./on-demand-micro-services-deployment-k8s/ingress-manager');

const app = express();
var multer  = require('multer');
var upload = multer({ dest: 'tmp/' })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * Installs the requested chart into the Kubernetes cluster
 */
app.post('/install',
  async (req, res) => {
    const deployOptions = req.body;

    const helm = new Helm();
    await helm.install(deployOptions)
      .then((installResponse) => {
        res.send({
          status: 'success',
          serviceName: installResponse.serviceName,
          releaseName: installResponse.releaseName,
        });
      }).catch((err) => {
        console.error(`Chart installation failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Installation failed.',
        });
      });
  });

/**
 * Deletes an already installed chart, identified by its release name
 */
app.post('/delete',
  async (req, res) => {
    execPost(req, res,'delete');
  });

/**
 * Upgrades an already installed chart, identified by its release name
 */
app.post('/upgrade',
  async (req, res) => {
    execPost(req, res,'upgrade');
  });

// Ports allocator functionallity

/**
 * Get a single unused port in the ingress controller
 */
app.get('/getPort',
  async (req, res, next) => {
    const portService = new PortsAllocator();
    const { lbip } = req.body;

    await portService.getPort(lbip)
      .then((data) => {
        res.send(data);
      })
      .catch(next);
  });

// Ingress controller functionallity

/**
 * Sets an inbound rule in the ingress controller, to expose a service endpoint
 */
app.post('/setrule',
  async (req, res) => {
    // init params
    const {
      serviceName,
      servicePort,
      loadBalancerIp,
      loadBalancerPort,
      release,
    } = req.body;

    const ingressManager = new IngressManager();
    await ingressManager.setRule(
      serviceName, servicePort, loadBalancerPort, loadBalancerIp, release,
    )
      .then((response) => {
        res.send({
          status: 'success',
          ip: response.ip,
          port: response.port,
          releaseName: response.releaseName,
        });
      })
      .catch((err) => {
        console.error(`Setting rule failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: 'Failed setting rule',
        });
      });
  });

//helm repo list
app.get('/repoList',
  async (req, res) => {
    execGet(req, res,'repoList');
  });

//helm search [repoName]
app.get('/search',
  async (req, res) => {
    execGet(req, res,'search');
  });

//helm inspect
app.get('/inspect',
  async (req, res) => {
    execGet(req, res,'inspect');
  });

//helm list
app.get('/list',
  async (req, res) => {
    execGet(req, res,'list');
  });

//helm history
app.get('/history',
  async (req, res) => {
    execGet(req, res,'history');
  });

//helm rollback
app.post('/rollback',
  async (req, res) => {
    execPost(req, res,'rollback');
  });

//helm rollback
app.post('/push',upload.single('chartPackage'),
  async (req, res) => {
    console.log('will be push file -- ');
    console.log(req.file);
    //接受文件，放本地
    //获得本地路径名称 chartFile
    var chartFile = req.file.path;
    req.body.chartFile=chartFile;
    execPost(req, res,'push');
  });

//通用get方法
async function execGet(req, res,functionName) {
    const deployOptions = req.query;
    const helm = new Helm();
    await helm[functionName](deployOptions)
      .then((execGetResponse) => {
        res.send(execGetResponse);
      }).catch((err) => {
        console.error(`helm-api ${functionName} failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: `execGet failed:${err.toString()}`,
        });
      });
}

//通用post方法
async function execPost(req, res,functionName) {
    const deployOptions = req.body;
    const helm = new Helm();
    await helm[functionName](deployOptions)
      .then((execPostResponse) => {
        res.send({
          status: 'success',
          details: execPostResponse
        });
      }).catch((err) => {
        console.error(`helm-api ${functionName} failed with exception :${err.toString()}`);
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: `execPost failed:${err.toString()}`,
        });
      });
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.set('port', process.env.PORT || 4000);

const server = app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${server.address().port}`);
});

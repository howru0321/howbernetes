#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const yaml = require('js-yaml');
const Configstore = require('configstore');
const pkg = require('./package.json');
const axios = require('axios');
const path = require('path');

const config = new Configstore(pkg.name);

const program = new Command();

function getMasterNodeConfig() {
  const ip = config.get('master-node').ip;
  const port = config.get('master-node').port;
  if (!ip) {
    throw new Error('master-node server IP address not set. Please run "howbectl master" first.');
  }
  if (!port) {
    throw new Error('master-node server port not set. Please run "howbectl master" first.');
  }
  return { ip, port };
}

program
  .name('howbectl')
  .description('CLI tool to manage deployments and scaling of containers')
  .version('1.0.0');

program
  .command('master')
  .description('Modify a master-node server information')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'masterIp',
        message: 'Enter the master-node server IP address',
        validate: (input) => {
          const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
          return valid || 'Please enter a valid IP address';
        }
      },
      {
        type: 'input',
        name: 'masterPort',
        message: 'Enter the master-node server port',
        validate: (input) => {
            const port = parseInt(input, 10);
            const valid = port >= 0 && port <= 65535;
            return valid || 'Please enter a valid port number (0-65535)';
        }
      }
    ]);

    config.set('master-node', {
        ip: answers.masterIp,
        port: answers.masterPort
      });
      console.log(`Modify master-node information by IP address ${answers.masterIp} and port ${answers.masterPort}.`);
  });

program
  .command('worker')
  .description('Add a worker-node information')
  .action(async () => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a worker-node name',
        validate: (input) => {
            const workerNodes = config.get('worker-node') || {};
            if (workerNodes.hasOwnProperty(input)) {
              return 'Name already exists. Please enter a different name.';
            }
            return true;
          }
      },
      {
        type: 'input',
        name: 'workerIp',
        message: 'Enter a worker IP address',
        validate: (input) => {
          const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
          return valid || 'Please enter a valid IP address';
        }
      },
      {
        type: 'input',
        name: 'workerPort',
        message: 'Enter the worker-node server port',
        validate: (input) => {
            const port = parseInt(input, 10);
            const valid = port >= 0 && port <= 65535;
            return valid || 'Please enter a valid port number (0-65535)';
        }
      }
    ]);

    try {
      const response = await axios.post(`http://${ip}:${port}/worker`, {
        name: answers.name,
        ip: answers.workerIp,
        port: answers.workerPort
      }, {
        'Content-Type': 'application/json'
      });
      console.log('Response:', response.data);

      console.log(`Worker-node ${answers.name} with IP address ${answers.workerIp} and port ${answers.workerPort} added.`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

// Deploy command
program
  .command('deploy <file>')
  .description('Deploy a container using a YAML configuration file')
  .action(async (file) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    try {
        const fileContent = fs.readFileSync(file, 'utf8');

        const response = await axios.post(`http://${ip}:${port}/deploy`, { data: fileContent }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

        console.log('Deployment response:', response.data);
      } catch (error) {
        console.error('Error during deployment:', error.message);
      }
  });

// Scale command
program
  .command('scale <deployment>/<container>')
  .description('Scale the number of replicas for a specific container in a deployment')
  .option('--replicas <number>', 'Number of replicas', '1')
  .action((resource, options) => {
    const [deployment, container] = resource.split('/');
    const replicas = options.replicas;
    if (!deployment || !container) {
      console.error('Please provide both deployment and container names in the format howbectl <deployment>/<container>');
      return;
    }

    console.log(`Scaling deployment "${deployment}" and container "${container}" to ${replicas} replicas.`);
  });

// Run command
program
  .command('run <container>')
  .description('Create and run a particular image')
  .option('--image <number>')
  .action(async (container, options) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    const image = options.image;
    if (!container) {
      console.error('Please provide both deployment and container names in the format howbectl <container>');
      return;
    }
    if (!image) {
      console.error('The --image option is required.');
      return;
    }

    try {
      const response = await axios.post(`http://${ip}:${port}/create/pod`, {
        podName : container,
        containerInfolist : [
          {
            name : container,
            image : image
          },
        ]
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error.message);
    }
    
  });

// Remove command
program
  .command('remove <container>')
  .description('Remove container')
  .action(async (container) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }
    
    if (!container) {
      console.error('Please provide both deployment and container names in the format howbectl <container>');
      return;
    }

    try {
      const response = await axios.post(`http://${ip}:${port}/remove`, {
        container
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });


// Create command
program
  .command('create')
  .description('Create a resource from a file')
  .option('-f, --filename <filePath>', 'Path to the YAML file')
  .action(async (cmd) => {
    let filePath = cmd.filename;

    if (!filePath) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Please provide the path to the YAML file:',
          validate: (input) => {
            if (fs.existsSync(input)) {
              return true;
            }
            return 'File does not exist. Please provide a valid file path.';
          }
        }
      ]);
      filePath = answers.filePath;
    }

    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    let data
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      data = yaml.load(fileContents);
    } catch (error) {
      console.error('Error reading or parsing YAML file:', error.message);
    }

    kind = data.kind
    if(kind=="Pod"){
      const podName= data.metadata.name;
      const containerInfolist = data.spec.containers;

      try {
        const response = await axios.post(`http://${ip}:${port}/create/pod`, {
          podName,
          containerInfolist
        });
        console.log('Response:', response.data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    } else if(kind == "Deployment"){
      const deployName=data.metadata.name
      const replicas = data.spec.replicas
      const podName = data.spec.template.metadata.name
      const containerInfolist = data.spec.template.spec.containers

      try {
        const response = await axios.post(`http://${ip}:${port}/create/deploy`, {
          deployName: deployName,
          replicas: replicas,
          podInfo:{
            podName : podName,
            containerInfolist : containerInfolist
          }
        });
        console.log('Response:', response.data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
  });

// Delete command
program
  .command('delete <pod>')
  .description('Delete pod')
  .action(async (pod) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }
    
    if (!pod) {
      console.error('Please provide pod name in the format howbectl delete <container>');
      return;
    }

    try {
      const response = await axios.delete(`http://${ip}:${port}/delete?name=${pod}`);
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

program
  .command('config')
  .description('Check current configuration')
  .action(() => {
    console.log(config.all);
  });

program.parse(process.argv);
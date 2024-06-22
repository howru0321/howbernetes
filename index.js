#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const yaml = require('js-yaml');
const Configstore = require('configstore');
const pkg = require('./package.json');
const axios = require('axios');

const config = new Configstore(pkg.name);

const program = new Command();

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
      console.log(`Master-node with IP address ${answers.masterIp} and port ${answers.masterPort} added.`);
  });

program
  .command('worker')
  .description('Add a worker-node server IP address')
  .action(async () => {
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

    const workerNodes = config.get('worker-node') || {};
    workerNodes[answers.name] = {
      ip: answers.workerIp,
      port: answers.workerPort
    };
    config.set('worker-node', workerNodes);
    console.log(`Worker-node ${answers.name} with IP address ${answers.workerIp} and port ${answers.workerPort} added.`);
  });

// Deploy command
program
  .command('deploy <file>')
  .description('Deploy a container using a YAML configuration file')
  .action(async (file) => {
    if (!ip) {
      console.error('master-node server IP address not set. Please run "howbectl master" first.');
      return;
    }
    if (!port) {
        console.error('master-node server port not set. Please run "howbectl master" first.');
        return;
      }

    try {
        const fileContent = fs.readFileSync(file, 'utf8');

        const ip = config.get('master-node').ip;
        const port = config.get('master-node').port;

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
      const ip = config.get('master-node').ip;
      const port = config.get('master-node').port;
      
      const response = await axios.post(`http://${ip}:${port}/run`, {
        container,
        image
      });
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
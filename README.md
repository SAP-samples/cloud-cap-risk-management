# Welcome

Welcome to this tutorial for application development on SAP Business Technology Platform (SAP BTP). We provide information and examples on how to develop and deploy an application based on [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/) on SAP BTP using different tools and services step by step.

It's planned to provide multiple modules that are built upon each other. You can start the tutorial with the first module, or start in between, because the source code for every tutorial module is provided in this repository.

## Who Is This Tutorial For?

The tutorial is suitable for new or experienced developers on SAP BTP. The purpose of this project is to help application developers get a quick start on development, provide best practices, solve common issues, use common services, identify areas that need to be improved, and have an end-to-end scenario for validation.

## What Topics Are Covered in the Tutorial?

The tutorial covers a variety of topics starting from basic onboarding tasks to creating development pipelines. The tasks are bundled in a step-by-step tutorial that features the following topics:

- Setting up the development environment
- Creating a service based on CAP
- Implementing authorization checks
- Creating a SAP BTP trial account
- Deployment on SAP BTP, Cloud Foundry or on Kyma environment

Stay tuned for new modules.

## How Can You Work with the Tutorial?

The core of this site is the [Tutorial](Sources.md) page. In the tutorial, you get to know, step by step, the whole development process on SAP BTP. Make sure to do the necessary [Installations](installation.md) first before starting the tutorial. After that, you can follow the tutorial through the different modules.

Check out the provided [Tutorial Overview](Tutorial_Overview.md) to get an overview of what module you need to do and what modules are optional. If you can't complete a certain module, there’s always the possibility of cloning a completed version of the module at the start of the next module. You can find the link in the box called **Prerequisites**.

* The `master` branch contains the [tutorial](http://sap-samples.github.io/cloud-cap-risk-management) that describes how to build the examples and how to deploy it to SAP BTP. <!-- TODO: add link to branches, is this profiled here [Examples](https://pages.github.tools.sap/CPES/CPAppDevelopment/Examples/)? -->
* All other branches contain the resulting source code of a tutorial module.

## Requirements

The requirements are described in this [tutorial](http://sap-samples.github.io/cloud-cap-risk-management).

## Download and Installation

If you want to start from a specific tutorial module, get the name of its branch from the [tutorial](http://sap-samples.github.io/cloud-cap-risk-management), download this repository and switch to the desired branch:

```bash
git clone https://github.com/SAP-samples/cloud-cap-risk-management
cd cloud-cap-risk-management
checkout <branch>
```

## Known Issues

You can find the known issues [here](https://github.com/SAP-samples/cloud-cap-risk-management/issues).

## How to Obtain Support

Check out the documentation for:

* [CAP aka "capire"](https://cap.cloud.sap/docs/advanced/troubleshooting)
* [SAP BTP](https://help.sap.com/viewer/product/CP/Cloud/)

In case you have a question, find a bug, or otherwise need support to use SAP products, use:

* [CAP Community](https://answers.sap.com/tags/9f13aee1-834c-4105-8e43-ee442775e5ce)
* [SAP Community](https://community.sap.com/)
* [SAP BTP Support Components](https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/08d1103928fb42f3a73b3f425e00e13c.html)

If you face a problem with the example application or the description, feel free to create an [issue](https://github.com/SAP-samples/cloud-cap-risk-management/issues).

## Contributing

If you have suggestions on how to improve the tutorial, you're welcome to provide your input [here](https://github.com/SAP-samples/cloud-cap-risk-management/issues).

## License

[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/cloud-cap-risk-management)](https://api.reuse.software/info/github.com/SAP-samples/cloud-cap-risk-management)

Copyright (c) 2021 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.

# vue-tmpl-cli

vue-cli工具的简化版本，用于生成[vue-spa-template](https://github.com/shenzhim/vue-spa-template)，其中有一些定制化的配置。

和vue-cli一样，vue-tmpl-cli主要使用了[download-git-repo](https://github.com/flipxfx/download-git-repo)下载远程的模版库，然后使用[metalsmith](https://github.com/segmentio/metalsmith) 统一处理模版文件，生成基础项目代码。

### Usage

``` bash
$ npm install -g vue-tmpl-cli
$ vue-tmpl init shenzhim/vue-spa-template my-project
```

- [shenzhim/vue-spa-template](https://github.com/shenzhim/vue-spa-template) - A template for spa project based on vue2.5 + vue-router + vuex + axios + webpack.


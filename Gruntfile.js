/*global module:false*/

const _ = require("lodash");
const fs = require("fs");
const path = require("path");

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);
  
  const SWAGGER_SRC = "https://oss.sonatype.org/content/repositories/snapshots/io/swagger/swagger-codegen-cli/3.0.0-SNAPSHOT/swagger-codegen-cli-3.0.0-20180616.165431-82.jar";

  grunt.initConfig({
    "curl": {
      "swagger-codegen":  {
        src: SWAGGER_SRC,
        dest: "swagger-codegen-cli.jar"
      }
    },
    "clean": {
      "jaxrs-spec-cruft": [
        "jaxrs-spec-generated/src/main/java/fi/hacklabmikkeli/labapi/server/RestApplication.java"
      ],
      "jaxrs-spec-sources": ["jaxrs-spec-generated/src"],
      "java-sources": ["java-generated/src"]
    },
    // mv jaxrs-spec-generated/pom.xml jaxrs-spec-generated/pom.xml.before && `cat jaxrs-spec-generated/pom.xml.before|grep version -m 1|sed -e \"s/.*<version>//\"|sed -e \"s/<.*//\"`
    "shell": {
      "jaxrs-spec-generate": {
        command : "" +
          "java -jar swagger-codegen-cli.jar generate " +
          "-i ./swagger.yaml " +
          "-l jaxrs-spec " +
          "--api-package fi.hacklabmikkeli.labapi.server.rest " +
          "--model-package fi.hacklabmikkeli.labapi.server.rest.model " +
          "--group-id fi.hacklabmikkeli.labapi " +
          "--artifact-id lab-api-spec " +
          "--artifact-version 0.0.1-SNAPSHOT " +
          "--template-dir jaxrs-spec-templates " +
          "--additional-properties dateLibrary=java8,useBeanValidation=true,sourceFolder=src/main/java,interfaceOnly=true " +
          "-o jaxrs-spec-generated/"
      },
      "jaxrs-spec-install": {
        command : "mvn install",
        options: {
          execOptions: {
            cwd: "jaxrs-spec-generated"
          }
        }
      },
      "javascript-generate": {
        command : "java -jar swagger-codegen-cli.jar generate " +
          "-i ./swagger.yaml " +
          "-l javascript " +
          "-o javascript-generated/ " +
          "--additional-properties useES6=false,usePromises=true,projectName=lab-api-client,projectVersion="  + require("./javascript-generated/package.json").version
      },
      "javascript-bump-version": {
        command: "npm version patch",
        options: {
          execOptions: {
            cwd: "javascript-generated"
          }
        }
      },
      "javascript-push": {
        command : "git add . && git commit -m 'Generated javascript source' ; git push",
        options: {
          execOptions: {
            cwd: "javascript-generated"
          }
        }
      }
    }
  });
  
  grunt.registerTask("download-dependencies", "if-missing:curl:swagger-codegen");
  grunt.registerTask("jaxrs-gen", [ "download-dependencies", "clean:jaxrs-spec-sources", "shell:jaxrs-spec-generate", "clean:jaxrs-spec-cruft", "shell:jaxrs-spec-install" ]);
  grunt.registerTask("javascript-gen", [ "shell:javascript-generate" ]);
  grunt.registerTask("javascript", [ "javascript-gen", "shell:javascript-bump-version", "shell:javascript-push" ]);

  grunt.registerTask("default", [ "jaxrs-gen" ]);

};

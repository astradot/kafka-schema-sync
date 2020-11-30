# kafka-schema-sync


You describe your Kakfa topics and their configuration in a separate Yaml File. This tool will then take that file and generate those topics with their config in your kafka cluster.
It will even update the configs of existing topics if they already exist.

The tool never deletes any existing topics.


## Install

```
npm install --global @astradot/kafka-schema-sync
```

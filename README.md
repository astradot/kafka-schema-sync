# kafka-schema-sync

This tool was designed at Astradot to keep our Kafka topics in sync across staging and prod environments.  

[Read blog post](https://blog.astradot.com/kafka-schema-sync-keep-your-kafka-topics-synced/) for details.


You describe your Kakfa topics and their configuration in a separate Yaml File. This tool will then take that file and generate those topics with their config in your kafka cluster.
It will even update the configs of existing topics if they already exist.

The tool never deletes any existing topics.


## Install

```
npm install --global @astradot/kafka-schema-sync
```

## Usage

```
 kafka-schema-sync --config topic-config.yml
 ```
 
 ## Sample Config
 
 ```yml
bootstrapServers: "localhost:9092"
replication: 3
defaultCompression: "zstd"
topics:
  - name: server-metrics
    retentionHours: 12
  - name: user-events
    retentionHours: 48

```

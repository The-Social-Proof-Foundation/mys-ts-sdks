# Simple aggregator

You can read blobs from this example by making a get request to
`localhost:3000/v1/blobs/<some blob ID>`

To save a blob as a file, you can use the following curl command:

```base
curl "localhost:3000/v1/blobs/<some blob ID>" -o <some file name>
```

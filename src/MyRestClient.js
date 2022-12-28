import RestClient from 'ra-data-json-server';

const MyRestClient = (apiUrl, httpClient) => {
  const client = RestClient(apiUrl,httpClient);

  return  {
    getList: (resource, params) => {
      console.log('calling getList')
      return client.getList(resource,params)
    }, 
    getOne: (resource, params) => {
      console.log('calling getOne', resource,params)
      return client.getOne(resource,params)
    }, 
    getMany: (resource, params) => {
      console.log('calling getMany',resource,params)
      const promises = []
      params.ids.forEach((id)=> {
        promises.push(
          client.getOne(resource,{id}).then(response =>response.data)
        )
      })
      return Promise.all(promises).then((results)=> ({data: results}))
    },
    getManyReference: (resource, params) => {
      console.log('calling getManyReference',resource,params)
      return client.getManyReference(resource,params)
    },
    update: (resource, params) => {
      console.log('calling update', resource, params)
      return client.update(resource,params)
    },
    updateMany: (resource, params) => {
      console.log('calling updateMany')
      return client.updateMany(resource,params)
    },
    create: (resource, params) => {
      console.log('calling create')
      return client.create(resource,params)
    },
    delete: (resource, params) => {
      console.log('calling delete')
      return client.delete(resource,params)
    },
    deleteMany: (resource, params) => {
      console.log('calling deleteMany')
      return client.deleteMany(resource,params)
    }
  };
}

export default MyRestClient;
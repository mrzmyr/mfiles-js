const mime = require('mime-types')
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const download = require('download');

// Datatypes: https://www.m-files.com/api/documentation/latest/index.html#MFilesAPI~MFDataType.html

module.exports = class MFiles {
  /**
   * @param {Object} options vault initialisation data
   * @example
   * const Mfiles = require('mfiles-js');
   * const mfiles = new Mfiles({
   *   vault_guid: '{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXX}',
   *   vault_url: 'https://kb.cloudvault.m-files.com'
   * });
   */
  constructor(options) {
    this.vault_guid = options.vault_guid
    this.vault_url = options.vault_url
  }

  /**
   * Authenticate with the vault, the auth `token` will be saved inside the `mfiles` class instance to make authenticated calls from there on
   * @param  {Object.<{ username: String, password: String }>} options credentials to authenticate with
   * @return {Promise} returns the token in an object
   * @example
   * mfiles.auth({ username: 'MY_USERNAME', password: 'MY_PASSWORD' })
   */
  auth(options) {
    return rp({
      method: 'POST',
      uri: `${this.vault_url}/REST/server/authenticationtokens.aspx`,
      json: true,
      body: {
        "Password": options.password,
        "Username": options.username,
        "VaultGuid": this.vault_guid
      }
    })
    .then(json => {
      let token = json.Value;
      this._token = token;
      return { token }
    })
    .catch(function (err) {
      console.error(err);
    });
  }

  /**
   * Make an authenticated request
   * @private
   * @param  {String} uri
   * @return {Promise} response of the request
   */
  _r(uri) {
    console.log(`${this.vault_url}/REST${uri}`);

    return rp({
      uri: `${this.vault_url}/REST${uri}`,
      headers: { "X-Authentication": this._token },
      json: true
    })
  }

  /**
   * To execute a quicksearch, with a querystring parameter and set its value to the term to search by. This is equivalent to using the search bar at the top of the M-Files Desktop or Web interfaces.
   * @param {String | Object} query_params
   * @async
   * @returns {Promise}
   * @example
   * mfiles.search('My document example title');
   * @example
   * mfiles.search({ '100': '3' }) // get all objects where the class (property id '100') is '3'
   * @example
   * mfiles.search({ 'Class': '3' }) // or use direct name of the property to search
   */
  async search(query_params) {

    let query_uri = '';

    if(typeof query_params === 'object') {
      const values = Object.values(query_params);
      const keys = Object.keys(query_params);

      let query_uri_params = [];

      for (var i = 0; i < keys.length; i++) {
        if(isNaN(keys[i])) {
          let property = await this.getPropertyByTitle(keys[i]);
          query_uri_params.push(`p${property.ID}=${values[i]}`)
        } else {
          query_uri_params.push(`p${keys[i]}=${values[i]}`)
        }
      }

      query_uri = query_uri_params.join('&')
    } else {
      query_uri = `q=${params}`
    }

    return this._r(`/objects.aspx?${query_uri}`)
  }

  /**
   * Get all objects recently accessed by the authenticated (`.auth`) user
   * @return {Promise} a list of all objects recently accessed
   * @example
   * mfiles.getRecentlyAccessedByMe()
   */
  getRecentlyAccessedByMe() {
    return this._r('/recentlyaccessedbyme')
  }

  /**
   * Get web permalink by ObjectGUID
   * @see https://developer.m-files.com/Built-In/URLs
   * @param  {String} ObjectGUID of an object
   * @return {String} Full url of the permalink
   * @example
   * mfiles.getPermalink('2D50F77D-F828-4282-B2ED-7420844C49A0')
   * @example
   * mfiles.getPermalink('{2D50F77D-F828-4282-B2ED-7420844C49A0}') // will auto strip
   * // => https://kb.cloudvault.m-files.com/Default.aspx?#F6A60D09-00A4-4287-AB8C-D437294E85B0/object/2D50F77D-F828-4282-B2ED-7420844C49A0/latest
   */
  getPermalink(guid) {
    let guid_stripped = guid.replace(/\{|\}/g,'')
    let vault_guid_stripped = this.vault_guid.replace(/\{|\}/g,'')

    return `${this.vault_url}/Default.aspx?#${vault_guid_stripped}/object/${guid_stripped}/latest`
  }

  /**
   * Gets all items from a value list
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/valuelists/id/items/
   * @param  {Number} the id of the value list
   * @return {Array} list of value items
   * @example
   * mfiles.getValueListItems(10)
   */
  getValueListItems(id) {
    return this._r(`/valuelists/${id}/items`)
  }

  /**
   * Get all value lists
   * @see https://www.m-files.com/user-guide/latest/eng/Value_lists.html
   * @return {Promise} resolves to array of value lists
   * @example
   * mfiles.getValueLists()
   */
  getValueLists() {
    return this._r(`/valuelists`)
  }

  /**
   * Get all object types
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/objecttypes/
   * @return {Promise} array of object types
   * @example
   * mfiles.getObjectTypes()
   */
  getObjectTypes() {
    return this._r(`/structure/objecttypes`)
  }

  /**
   * Get all classes
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/classes/ 
   * @return {Promise} array with all classes
   * @example
   * mfiles.getClasses()
   */
  getClasses() {
    return this._r(`/structure/classes`)
  }

  /**
   * Get class details
   * @see https://www.m-files.com/user-guide/latest/eng/Classes.html
   * @param {Number} the id of the class
   * @return {Promise} get details about a class
   * @example
   * mfiles.getClass(0) // 0 = Document
   */
  getClass(id) {
    return this._r(`/structure/classes/${id}`)
  }

  /**
   * Get all possible object properties
   * @see https://www.m-files.com/user-guide/latest/eng/Property_definitions.html
   * @return {Promise} array of properties
   * @example
   * mfiles.getProperties()
   */
  getProperties() {
    return this._r(`/structure/properties`)
  }

  /**
   * Get details about a property
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/properties/id/
   * @param {String} id id of the property
   * @return {Promise} details about the propterty
   * @example
   * mfiles.getProperty()
   */
  getProperty(id) {
    return this._r(`/structure/properties/${id}`)
  }

  /**
   * Get a property object by title
   * @param  {String} title the title of the property
   * @return {Promise} resolves to the property object
   * @example
   * mfiles.getPropertyByTitle('Class')
   */
  getPropertyByTitle(title) {
    return new Promise(async (resolve, reject) => {
      let properties = await this.getProperties()

      for (var i = 0; i < properties.length; i++) {
        if(properties[i].Name === title) {
          return resolve(properties[i]);
        }
      }

      return reject(`property with '${title}' not found`)
    });
  }

  /**
   * Get all worksflows
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/workflows/
   * @return {Promise} array of all workflows
   * @example
   * mfiles.getWorkflows()
   */
  getWorkflows() {
    return this._r(`/structure/workflows`)
  }

  /**
   * Get workflow details
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/workflows/id/
   * @param {Number} id the workflow id
   * @return {Promise} object with workflow details
   * @example
   * mfiles.getWorkflow(103)
   */
  getWorkflow(id) {
    return this._r(`/structure/workflows/${id}`)
  }

  /**
   * Get a workflow states
   * @see https://www.m-files.com/user-guide/latest/eng/Individual_state.html
   * @param  {Number} id of the workflow (from `getWorkflows()`)
   * @return {Promise} array of workflow states
   * @example
   * mfiles.getWorkflowStates(103)
   */
  getWorkflowStates(id) {
    return this._r(`/structure/workflows/${id}/states`)
  }

  /**
   * Get a workflow state transitions
   * @see https://www.m-files.com/user-guide/latest/eng/workflow_state_transitions.html
   * @param  {Number} id of the workflow (from `getWorkflows()`)
   * @return {Promise} array of workflow state transitions
   * @example
   * mfiles.getWorkflowStateTransitions(3)
   */
  getWorkflowStateTransitions(id) {
    return this._r(`/structure/workflows/${id}/statetransitions`)
  }

  /**
   * Get object by object_type and object_id
   * @see https://developer.m-files.com/APIs/REST-API/Reference/resources/structure/objecttypes 
   * @param  {Number} object_type the id of the object type
   * @param  {Number} object_id the id of the object
   * @return {Promise} object data
   * @example
   * mfiles.getObject(0, 359102) // 0 = Document
   */
  getObject(object_type, object_id) {
    return this._r(`/objects/${object_type}/${object_id}`)
  }

  /**
   * Get [download promise](https://github.com/kevva/download) of a file
   * @see https://developer.m-files.com/Built-In/URLs/
   * @param  {Number|String} object_type the id of the object type
   * @param  {Number|String} object_id id of the object
   * @param  {Number|String} file_id id of the file
   * @return {Promise} Returning a [`download`](https://github.com/kevva/download) promise
   * @example
   * let object = await mfiles.getObject(0, 359102); // 0 = Document (see Object Types)
   * let file = object.Files[0];
   * let data = await mfiles.downloadFile(0, 359102, file.ID)
   * fs.writeFileSync(`./dist/${file.EscapedName}`, data);
   */
  downloadFile(object_type, object_id, file_id) {
    let url = `${this.vault_url}/REST/objects/${object_type}/${object_id}/latest/files/${file_id}/content?auth=${this._token}`;
    return download(url)
  }

  /**
   * Generate a class property value for document creation
   * @private
   * @see https://www.m-files.com/api/documentation/latest/index.html#MFilesAPI~MFBuiltInPropertyDef.html
   * @param  {Number|String} class id
   * @return {Object} property value object for a class
   */
  _PropertyValueClass(id) {
    return {
      "PropertyDef": 100, // Class
      "TypedValue": {
        "DataType": 9,
        "HasValue": false,
        "Value": null,
        "Lookup": {
          "Deleted": false,
          "DisplayValue": null,
          "Hidden": false,
          "Item": id,
          // Work around for a bug
          // https://developer.m-files.com/APIs/REST-API/Creating-Objects/
          "Version": -1 
        },
        "Lookups": null,
        "DisplayValue": null,
        "SortingKey": null,
        "SerializedValue": null
      }
    }
  }

  /**
   * Generate a title property value for document creation
   * @private
   * @see https://www.m-files.com/api/documentation/latest/index.html#MFilesAPI~MFBuiltInPropertyDef.html
   * @param  {String} title of the property value
   * @return {Object} property value object for a document title
   */
  _PropertyValueTitle(title) {
    return {
      "PropertyDef": 0, // Name or Title
      "TypedValue": {
        "DataType": 1,
        "HasValue": false,
        "Value": title,
        "Lookup": null,
        "Lookups": null,
        "DisplayValue": null,
        "SortingKey": null,
        "SerializedValue": null
      }
    }
  }

  /**
   * Create a document by file path
   * @see https://developer.m-files.com/APIs/REST-API/Creating-Objects/
   * @see https://www.m-files.com/user-guide/latest/eng/built-in_property_definitions.html
   * @param  {String} file_path Path of the file you want to create the document with
   * @param  {Number|String} class_id id of the required field `class`
   * @return {Promise} resolves to the new created document object
   * @example
   * // create file with class "Document" (0 = Document)
   * mfiles.createDocument('./myfile.docx', 0)
   */
  async createDocument(file_path, class_id, property_values = []) {
    // First upload the file and afterwards create a document based on that
    let file_data = await this.uploadFile(file_path);

    let property_value = [
      _PropertyValueClass(class_id),
      _PropertyValueTitle(file_data.Title)
    ].concat(property_values);

    return rp({
      uri: `${URL_ROOT}/REST/objects/0`, // 0 = Document (Object Types)
      method: 'POST',
      headers: { "X-Authentication": this._token },
      json: true,
      body: {
        "PropertyValues": property_value,
        "Files": [file_data]
      },
    })
  }

  /**
   * Update a file to create a document upon it, this function is being used for `createDocument`
   * @param  {String} file_path Path of the file
   * @return {Promise} resolves to the returned file object
   * @example
   * mfiles.uploadFile('./myfile.docx')
   */
  uploadFile(file_path) {
    return rp({
      method: 'POST',
      uri: `${this.vault_url}/REST/files.aspx`,
      json: true,
      headers: { "X-Authentication": this._token },
      formData: {
        file: {
          value: fs.createReadStream(file_path),
          options: {
            filename: path.basename(file_path),
            contentType: mime.lookup(file_path)
          }
        }
      }
    })
  }
}
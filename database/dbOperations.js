
const addDocument = async ({ model, id, data }) => {
    try{
        if(!model || !id || !data) throw new Error('Invalid data')

        const newDocument = new model({ 
            ...data, 
            _id: id, 
        })
        
        return await newDocument.save()
    }catch(err){
        console.error(`Error creating document: ${err.message}`);
        if (!(err instanceof Error)) {
            err = new Error("ADD_DOCUMENT_ERROR");
        }
        throw err
    }
}

const getDocument = async ({ model, query, projection = null }) => {
    try{
        if(!model || !data) throw new Error('Invalid data')

    
        return await model.findOne(query, projection)
    }catch(err){
        console.error(`Error finding document: ${err.message}`);
        if (!(err instanceof Error)) {
            err = new Error("GET_DOCUMENT_ERROR");
        }
        throw err
    }
}

const updateDocument = async ({ model, id, data, }) => {
    try{
        if(!model || !id || !data) throw new Error('Invalid data')

        const doc = await model.findById(id);

        if (!doc) throw new Error('Document not found');

        Object.assign(doc, data);

        return await doc.save();
    }catch(err){
        console.error(`Error udpating document: ${err.message}`);
        if (!(err instanceof Error)) {
            err = new Error("UPDATE_DOCUMENT_ERROR");
        }
        throw err
    }
}

const deleteDocument = async ({ model, id }) => {
    try{
        if(!model || !id) throw new Error('Invalid data.')

        const deletedDoc = await model.findByIdAndDelete(id);

        if (!deletedDoc) throw new Error(`Document not found with id: ${id}`);

        return deletedDoc;
    }catch(err){
        console.error(`Error deleting document: ${err.message}`);
        if (!(err instanceof Error)) {
            err = new Error("DELETE_DOCUMENT_ERROR");
        }
        throw err
    }
}

module.exports = {
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument
}
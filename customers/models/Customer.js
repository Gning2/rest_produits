import mongoose from 'mongoose' 

const customerSchema = new mongoose.Schema({
createdAt: {
    type: Date,
},
name: {
    type: String,
    
},
username: {
    type: String,
    
},
firstName: {
    type: String,
    
},
lastName: {
    type: String,
},
address: {
    postalCode: {
    type: String,
    },
    city: {
    type: String,
    }
},
profile: {
    firstName: {
    type: String,
    },
    lastName: {
    type: String,
    }
},
company: {
    companyName: {
    type: String,
    }
},
id: {
    type: Number
}
});

// Création du modèle Customer à partir du schéma
export const Customer = mongoose.model('Customer', customerSchema);

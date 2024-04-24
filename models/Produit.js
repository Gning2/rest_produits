import mongoose from 'mongoose'

const produitSchema = new mongoose.Schema({
    createdAt: { 
        type: Date, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    details: {
        price: { 
            type: String, 
            required: true 
        },
        description: { 
            type: String, 
            required: true 
        },
        color: { 
            type: String, 
            required: true 
        }
    },
    stock: { 
        type: Number, 
        required: true 
    },
    id: { 
        type: String, 
        required: true 
    }
});

//création du modèle Product à partir du schéma
const Produit = mongoose.model('Produit', produitSchema);

//exportation du modèle
export default Produit
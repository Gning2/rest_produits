require('dotenv').config();
import { get } from 'axios';
import express, { json } from 'express';
import { connect as _connect, Types } from 'mongoose';
import Produit  from './models/Produit';
const app = express();
const port = 5000;

// Connexion à la base de données
const url = process.env.MONGO_URL;
function connect(){
    try{
        _connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to the database');
    }
    catch(err){
        console.log(err);
    }
}
connect();


app.use(json());


// URL de l'API Mock.io pour récupérer les données de produits
const mockApiUrl = 'https://6606d9f9be53febb857ec4eb.mockapi.io/api/v1/products';


// Fonction pour récupérer et enregistrer les produits dans la base de données
async function fetchAndSaveProducts() {
    try {
    // Récupérer les données de produits depuis Mock.io
    const response = await get(mockApiUrl);
    const productsData = response.data;

    // Transformer les données en instances de modèle Mongoose et les sauvegarder dans la base de données
    for (const productData of productsData) {
        const produit = new Produit(productData);
        await produit.save();
        console.log(`Produit enregistré : ${produit.name}`);
    }

    console.log('Tous les produits ont été enregistrés dans la base de données.');
} catch (error) {
    console.error('Une erreur s\'est produite lors de la récupération ou de l\'enregistrement des produits :', error);
    }
}

// Appel de la fonction pour récupérer et enregistrer les produits
fetchAndSaveProducts();

/*

========================= Définir toutes les routes dans cette section ========================= 

*/

//Route get pour récupérer tous les produits
app.get('/produits', (req, res) => {
    find()
    .then((produits) => {
        res.json(produits);
    })
    .catch((error) => {
        res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    });
});

//Route get pour récupérer un produit par son ID
app.get('/produits/:_id', (req, res) => {
    findById(req.params._id)
    .then((produit) => {
        if (produit) {
            res.json(produit);
        } else {
            res.status(404).json({ error: 'Produit non trouvé' });
        }
    })
    .catch((error) => {
        res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
    });
});

//Route post pour ajouter un produit
app.post('/produits', (req, res) => {
    const produit = new Produit({
        _id: new Types.ObjectId(),
        createdAt: req.body.createdAt,
        name: req.body.name,
        details: req.body.details,
        stock: req.body.stock,
        id: req.body.id
    });
    produit.save()
    .then((produit) => {
        res.json(produit);
    })
    .catch((error) => {
        res.status(500).json({ error: 'Erreur lors de la création du produit' });
    });
});

// Route PUT pour modifier un produit par son ID
app.put('/produits/:_id', (req, res) => {
    findByIdAndUpdate(req.params._id, req.body)
    .then((produit) => {
        if (produit) {
            res.json(produit);
        } else {
            res.status(404).json({ error: 'Produit non trouvé' });
        }
    })
    .catch((error) => {
        res.status(500).json({ error: 'Erreur lors de la modification du produit' });
    });
});

// Route DELETE pour supprimer un produit par son ID
app.delete('/produits/:_id', (req, res) => {
    findByIdAndDelete(req.params._id)
    .then((produit) => {
        if (produit) {
            res.json(produit);
        } else {
            res.status(404).json({ error: 'Produit non trouvé' });
        }
        })
    .catch((error) => {
        res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
    });
});

//Démarrer le serveur
app.listen(port,
    console.log(`Server running at http://localhost:${port}`)
)
import express from 'express';
import mongoose from 'mongoose'
import bodyParser from 'body-parser';
import axios from 'axios';
import { Product } from './model/Product.js';

const app = express();
const port = 5001;

const url = 'mongodb+srv://papa:passer123@cluster0.1qaei.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0';
const mockApiUrl = 'https://6606d9f9be53febb857ec4eb.mockapi.io/api/v1/products';

let authToken = null;

// Parser le corps des requêtes au format JSON
app.use(bodyParser.json());

function connect(){
    try{
        mongoose.connect(url, {
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

// Fonction pour récupérer et enregistrer les produits dans la base de données
async function fetchAndSaveProducts() {
    try {
        const response = await axios.get(mockApiUrl);
        const productsData = response.data;
        for (const productData of productsData) {
            const existingProduct = await Product.findOne({ id: productData.id });
            if (!existingProduct) {
                const product = new Product(productData);
                await product.save();
                console.log(`produit enregistré : ${product.name}`);
            } else {
                console.log(`Le produit avec l'id ${productData.id} existe déjà dans la base de données.`);
            }
        }
        console.log('Tous les produits ont été vérifiés et éventuellement enregistrés dans la base de données.');
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération ou de l\'enregistrement des produits :', error);
    }
}
fetchAndSaveProducts();

//génération du token qui est en fait le rôle de l'utilisateur connecté
function generateToken() {
    const roles = ['developer', 'commercial', 'marketing', 'management'];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    return randomRole;
}

// Ajout du token à la réponse HTTP lors de l'authentification
function addTokenToResponse(req, res, next) {
    authToken = generateToken();
    res.setHeader('Authorization', authToken);
    next();
}

// Vérifier si un token a été généré et l'utiliser pour autoriser l'accès à la route /products
function checkAuthToken(req, res, next) {
    if (!authToken) {
        return res.status(401).json({ message: 'Accès non autorisé. Jeton manquant.' });
    }

    const role = authToken;

    if (!role || !['developer', 'commercial', 'marketing', 'management'].includes(role)) {
        return res.status(403).json({ message: 'Accès non autorisé. Rôle invalide.' });
    }

    req.user = { role };
    next();
}

// Route pour contacter la route et obtenir un token avec un rôle aléatoire
app.get('/authenticate', addTokenToResponse, (req, res) => {
    res.json({ message: 'Token généré avec succès.' });
});

/* ===================================== Routes avec les autorisations d'accès ===================================*/

//Route pour récupérer les produits.
app.get('/products', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'commercial' || userRole === 'marketing' || userRole === 'management') {
        try {
            const products = await Product.find();
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des produits depuis la base de données.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Rôle non autorisé.' });
    }
});

// Route pour récupérer les informations d'un produit spécifique
app.get('/products/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'marketing' || userRole === 'commercial' || userRole === 'management') {
        try {
            const product = await Product.findOne({ id: req.params.id });
            if (!product) {
                return res.status(404).json({ message: 'Produit non trouvé.' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des informations du produit.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Rôle non autorisé.' });
    }
});

// Route pour mettre à jour les informations d'un produit spécifique
app.put('/products/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'marketing' || userRole === 'commercial' || userRole === 'management') {
        try {
            const updatedProductData = req.body;
            const updatedProduct = await Product.findOneAndUpdate({ id: req.params.id }, updatedProductData, { new: true });
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Produit non trouvé.' });
            }
            res.json(updatedProduct);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la mise à jour des informations du produit.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Rôle non autorisé.' });
    }
});

// Route pour créer un nouveau produit
app.post('/products', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'marketing') {
        try {
            const newProductData = req.body;
            const newProduct = new Product(newProductData);
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la création du nouveau produit.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Seuls les membres du service marketing sont autorisés à créer un nouveau produit.' });
    }
});

// Route pour supprimer un produit existant
app.delete('/products/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'marketing') {
        try {
            const deletedProduct = await Product.findOneAndDelete({ id: req.params.id });
            if (!deletedProduct) {
                return res.status(404).json({ message: 'Produit non trouvé.' });
            }
            res.json({ message: 'Produit supprimé avec succès.' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la suppression du produit.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Seuls les membres du service marketing sont autorisés à supprimer un produit.' });
    }
});

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
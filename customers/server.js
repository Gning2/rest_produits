import express from 'express';
import mongoose from 'mongoose'
import bodyParser from 'body-parser';
import axios from 'axios';
import {Customer} from './models/Customer.js'

const app = express();
const port = 5000;

const url = 'mongodb+srv://papa:passer123@cluster0.1qaei.mongodb.net/customers?retryWrites=true&w=majority&appName=Cluster0';
const mockApiUrl = 'https://6606d9f9be53febb857ec4eb.mockapi.io/api/v1/customers';

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
async function fetchAndSave() {
    try {
        const response = await axios.get(mockApiUrl);
        const customersData = response.data;
        for (const customerData of customersData) {
            const existingCustomer = await Customer.findOne({ username: customerData.username });
            if (!existingCustomer) {
                const customer = new Customer(customerData);
                await customer.save();
                console.log(`Client enregistré : ${customer.name}`);
            } else {
                console.log(`Le client avec le nom d'utilisateur ${customerData.username} existe déjà dans la base de données.`);
            }
        }
        console.log('Tous les clients ont été vérifiés et éventuellement enregistrés dans la base de données.');
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération ou de l\'enregistrement des clients :', error);
    }
}
fetchAndSave();

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

// Vérifier si un token a été généré et l'utiliser pour autoriser l'accès à la route /customers
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

//Route pour récupérer les customers.
app.get('/customers', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'commercial' || userRole === 'marketing' || userRole === 'management') {
        try {
            const customers = await Customer.find();
            res.json(customers);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des clients depuis la base de données.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Rôle non autorisé.' });
    }
});

// Route pour récupérer les informations d'un customer spécifique
app.get('/customers/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'marketing' || userRole === 'commercial' || userRole === 'management') {
        try {
            const customer = await Customer.findOne({ id: req.params.id });
            if (!customer) {
                return res.status(404).json({ message: 'Client non trouvé.' });
            }
            res.json(customer);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des informations du client.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Rôle non autorisé.' });
    }
});

// Route pour mettre à jour les informations d'un customer spécifique
app.put('/customers/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'marketing') {
        try {
            const updatedCustomerData = req.body;
            const updatedCustomer = await Customer.findOneAndUpdate({ id: req.params.id }, updatedCustomerData, { new: true });
            if (!updatedCustomer) {
                return res.status(404).json({ message: 'Client non trouvé.' });
            }
            res.json(updatedCustomer);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la mise à jour des informations du client.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Les membres du service marketing ne peuvent pas modifier les clients.' });
    }
});

// Route pour créer un nouveau customer
app.post('/customers', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'developer' || userRole === 'commercial') {
        try {
            const newCustomerData = req.body;
            const newCustomer = new Customer(newCustomerData);
            await newCustomer.save();
            res.status(201).json(newCustomer);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la création du nouveau client.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Seuls les développeurs et les commerciaux peuvent créer de nouveaux clients.' });
    }
});

// Route pour supprimer un customer existant
app.delete('/customers/:id', checkAuthToken, async (req, res) => {
    const userRole = req.user.role;
    if (userRole === 'management') {
        try {
            const deletedCustomer = await Customer.findOneAndDelete({ id: req.params.id });
            if (!deletedCustomer) {
                return res.status(404).json({ message: 'Client non trouvé.' });
            }
            res.json({ message: 'Client supprimé avec succès.' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la suppression du client.' });
        }
    } else {
        res.status(403).json({ message: 'Accès non autorisé. Seul le service management est autorisé à supprimer des clients.' });
    }
});

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
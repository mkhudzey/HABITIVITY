const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
require('dotenv').config();


exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const userExists = await User.existsByEmailOrUsername(email, username);

        if (userExists) {
            return res.status(400).json({ error: 'El nombre de usuario o correo electrónico ya están en uso' });
        }

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        
        const role = 'user';
        const user = await User.create(username, email, password, role);
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findByUsername(username);

        if (!user ) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('Usuario encontrado:', user.username);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error en el login', details: error.message });
    }
};

exports.delete = async (req, res) => {
    const tokenUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId);
    const tokenUserRole = req.user.role;

    if (tokenUserId !== targetUserId && tokenUserRole !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar esta cuenta.' });
    }

    try{
        const deleteUser = await User.deleteById(targetUserId);
        
        if(deleteUser.rowCount === 0){
            return res.status(404).json({ error: 'Usuario no encontrado'});
        }

        res.json( { message: 'Cuenta eliminada', user: deleteUser.rows[0]});
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la cuenta', details: error.message});
    }
};
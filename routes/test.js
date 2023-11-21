import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {

	res.status(200).json({ code: 200, message:'Received GET request' });

});

router.post('/', (req, res) => {

	res.status(200).json({ code: 200, message:'Received POST request' });

});

router.patch('/', (req, res) => {

	res.status(200).json({ code: 200, message:'Received PUT request' });

});

router.put('/', (req, res) => {

	res.status(200).json({ code: 200, message:'Received PUT request' });

});

router.delete('/', (req, res) => {

	res.status(200).json({ code: 200, message:'Received DELETE request' });

});

export default router;
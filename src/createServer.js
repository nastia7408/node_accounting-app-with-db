'use strict';

const express = require('express');
const { Op } = require('sequelize');
const { User, Expense } = require('./models/models');

const createServer = () => {
  const app = express();

  app.use(express.json());

  app.post('/users', async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send('Name is required');
    }

    try {
      const newUser = await User.create({ name });

      res.status(201).json(newUser);
    } catch (e) {
      res.status(400).send(e.message);
    }
  });

  app.get('/users', async (req, res) => {
    res.json(await User.findAll());
  });

  app.get('/users/:id', async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user);
  });

  app.patch('/users/:id', async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).send('Not found');
    }

    await user.update(req.body, { silent: true });
    res.json(user);
  });

  app.delete('/users/:id', async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).send('Not found');
    }
    await user.destroy();

    res.sendStatus(204);
  });

  app.post('/expenses', async (req, res) => {
    const { userId, spentAt, title, amount } = req.body;

    if (!userId || !spentAt || !title || amount === undefined) {
      return res.status(400).send('Missing fields');
    }

    try {
      const newExpense = await Expense.create(req.body);

      res.status(201).json(newExpense);
    } catch (e) {
      res.status(400).send('User not found');
    }
  });

  app.get('/expenses', async (req, res) => {
    const { userId, categories, from, to } = req.query;
    const where = {};

    if (userId) {
      where.userId = Number(userId);
    }

    if (categories) {
      where.category = { [Op.in]: categories.split(',') };
    }

    if (from || to) {
      where.spentAt = {};

      if (from) {
        where.spentAt[Op.gte] = from;
      }

      if (to) {
        where.spentAt[Op.lte] = to;
      }
    }

    const expenses = await Expense.findAll({ where });

    res.json(expenses);
  });

  app.get('/expenses/:id', async (req, res) => {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).send('Expense not found');
    }
    res.json(expense);
  });

  app.patch('/expenses/:id', async (req, res) => {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).send('Expense not found');
    }

    if (req.body.userId) {
      const user = await User.findByPk(req.body.userId);

      if (!user) {
        return res.status(400).send('User not found');
      }
    }

    await expense.update(req.body);
    res.json(expense);
  });

  app.delete('/expenses/:id', async (req, res) => {
    const deletedCount = await Expense.destroy({
      where: { id: req.params.id },
    });

    if (deletedCount === 0) {
      return res.status(404).send('Expense not found');
    }
    res.sendStatus(204);
  });

  return app;
};

module.exports = { createServer };

const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if(context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('books');
        return userData;
      };
      throw new AuthenticationError('You have to log in first!');
    },
    getAllUsers: async () => {
      return User.find().select('-__v -password');
    }
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if(!user) {
        throw new AuthenticationError('Incorrect/invalid email');
      };
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect/invalid password');
      };
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const addUserBook = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: input } },
          { new: true }
        );
        return addUserBook;
      }
      throw new AuthenticationError('Log in to add books!');
    },
    deleteBook: async (parent, { bookId }, context) => {
      if(context.user) {
        const bookToDelete = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        return bookToDelete;
      }
      throw new AuthenticationError('Log in to remove books!');
    }
  }
}

module.exports = resolvers;

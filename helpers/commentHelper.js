import joi from 'joi';
import model from '../models';

const {
  User, Article, Comment, CommentFeedback
} = model;

/**
 * @exports CommentHelper
 * @class CommentHelper
 * @description Comment Helper
 * */
class CommentHelper {
  /**
     * Check and return the previous comment's id
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {integer} Returns previous comment's id
     * @static
     */
  static async parentId(req, res, next) {
    let maxId = 1;
    await Comment.findAll().then((result) => {
      // eslint-disable-next-line array-callback-return
      result.map((comment) => {
        if (comment.id > maxId) {
          maxId = comment.id;
        }
      });
    });
    req.body.previousId = maxId;
    next();
  }

  /**
     * Check if Article exist and comment body is there
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return a message explaining an error
     * @static
     */
  static async isValid(req, res, next) {
    const { slug } = req.params;
    const article = await Article.findOne({
      where: {
        slug
      }
    });
    if (!article) {
      return res.status(400).send({ message: 'there is no article with the slug specified in the URL' });
    }
    const body = {
      data: req.body.body
    };
    const schema = joi.object().keys({
      data: joi
        .string()
        .trim()
        .required()
    });
    const { error } = joi.validate(body, schema);
    if (error) {
      return res.status(400).send({ message: 'INVALID comment body' });
    }
    next();
  }

  /**
     * create a comment
     * @param {object} req - an object
     *@return {object} Return the created comment
     */
  static async createComment(req) {
    const parentID = req.body.previousId;
    const { slug } = req.params;

    const createdComment = await Comment.create({
      userId: req.user.id,
      titleSlug: slug,
      body: req.body.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const childComment = createdComment.toJSON();

    const parentComment = await Comment.findOne({ where: { id: parentID } });
    if (parentComment === null) {
      return { message: 'this is the first comment', id: childComment.id, userId: req.user.id };
    }
    if (parentComment.userId !== childComment.userId) {
      return childComment;
    }
    const range = childComment.createdAt.getTime() - parentComment.createdAt.getTime();

    if (range <= 60000) {
      await Comment.update({ parentid: parentID }, { where: { id: childComment.id } });
      return { type: 'threadedComment comment created', timeRange: `${range} milliseconds` };
    }
    return { type: 'no threadedComment created', timeRange: `${range} milliseconds` };
  }

  /**
     * get all comment
     * @param {object} req - an object
     *@return {object} Return all comments on an article
     */
  static async getComments(req) {
    const { slug } = req.params;
    const fetchedComments = await Comment.findAll({
      where: { titleSlug: slug },
      include: [{ model: User, as: 'author', attributes: ['username', 'bio', 'image'] },
        { model: CommentFeedback, as: 'like', attributes: ['feedback', 'userId'] }],
      attributes: ['id', 'createdAt', 'updatedAt', 'body']
    });
    if (!fetchedComments[0]) {
      return { errors: { body: ['no commemts found on this article'] } };
    }
    return fetchedComments;
  }

  /**
     * get a comment
     * @param {object} req - an object
     *@return {object} Return one comment on an aricle
     */
  static async getOneComment(req) {
    const { slug } = req.params;
    const { id } = req.params;
    const fetchedComment = await Comment.findOne({
      where: { titleSlug: slug, id },
      include: [{ model: User, as: 'author', attributes: ['username', 'bio', 'image'] }],
      attributes: ['id', 'createdAt', 'updatedAt', 'body']
    });
    if (!fetchedComment) {
      return { errors: { body: ['commemt not found'] } };
    }
    return fetchedComment;
  }

  /**
     * Check if comment exist and the user who created it
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return a message explaining an error
     * @static
     */
  static async isCommentExist(req, res, next) {
    const { id } = req.params;
    const comment = await Comment.findOne({ where: { id } });
    if (!comment) {
      return res.status(404).send({ errors: { body: ['commemt to be altered not found'] } });
    }
    if (comment.userId === req.user.id) {
      req.body.comment = comment.body;
      next();
      return true;
    }
    return res.status(400).send({ message: 'user alters comments they only created' });
  }

  /**
     * deletes a comment
     * @param {object} req - an object
     *@return {object} Return a message saying the commmnet is deleted
     */
  static async deleteOneComment(req) {
    const { slug } = req.params;
    const { id } = req.params;
    await Comment.destroy({ where: { titleSlug: slug, id } });
    const destroyed = await Comment.findOne({ where: { titleSlug: slug, id } });
    if (destroyed === null) {
      return { message: `comment with id ${id} have been deleted` };
    }
    return { message: `comment with id ${id} have failed to be deleted` };
  }

  /**
     * deletes a comment
     * @param {object} req - an object
     *@return {object} Return a message saying the commmnet is deleted
     */
  static async updateOneComment(req) {
    const { slug } = req.params;
    const { id } = req.params;
    const { body } = req.body;
    const { comment } = req.body;
    await Comment.update({ body: body || comment.body }, { where: { titleSlug: slug, id } });
    const updatedComment = await Comment.findOne({ where: { id } });
    return { response: updatedComment };
  }

  /**
     * Check if comment exist and the user who created it
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return a message explaining an error
     * @static
     */
  static async commentExist(req, res, next) {
    const { id } = req.params;
    const comment = await Comment.findOne({ where: { id } });
    if (!comment) {
      return res.status(404).send({ errors: { body: ['commemt to be altered not found'] } });
    }
    req.params.slug = comment.titleSlug;
    next();
    return true;
  }

  /**
     * create a reply to a comment
     * @param {object} req - an object
     *@return {object} Return the created comment
     */
  static async replyComment(req) {
    const { id } = req.params;
    const { slug } = req.params;

    const replyComment = await Comment.create({
      userId: req.user.id,
      replyid: id,
      titleSlug: slug,
      body: req.body.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return replyComment;
  }

  /**
     * get all comment
     * @param {object} req - an object
     *@return {object} Return all comments on an article
     */
  static async getCommentReplies(req) {
    const { id } = req.params;
    const parentComment = await Comment.findOne({
      where: { id },
      attributes: ['id', 'createdAt', 'updatedAt', 'body']
    });
    if (!parentComment) {
      return { errors: { body: ['no comment found'] } };
    }

    const replyComments = await Comment.findAll({
      where: { replyid: id },
      attributes: ['id', 'createdAt', 'updatedAt', 'body']
    });
    if (!replyComments[0]) {
      return { errors: { body: ['no replies to this comment found'] } };
    }
    return { comment: parentComment, replies: replyComments };
  }

  /**
     * Check if comment exist and the user who created it
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return a message explaining an error
     * @static
     */
  static async isReplytExist(req, res, next) {
    const { replyId } = req.params;
    const comment = await Comment.findOne({ where: { id: replyId } });
    if (!comment) {
      return res.status(404).send({ errors: { body: ['reply to be altered not found'] } });
    }
    if (comment.userId === req.user.id) {
      req.body.reply = comment.body;
      next();
      return true;
    }
    return res.status(400).send({ message: 'user alters replies they only created' });
  }

  /**
     * deletes a reply
     * @param {object} req - an object
     *@return {object} Return a message saying the commmnet is deleted
     */
  static async deleteOneReply(req) {
    const { id } = req.params;
    const { replyId } = req.params;
    await Comment.destroy({ where: { replyid: id, id: replyId } });
    const destroyed = await Comment.findOne({ where: { id: replyId } });
    if (destroyed === null) {
      return { message: `reply with id ${replyId} have been deleted` };
    }
    return { message: `reply with id ${replyId} have failed to be deleted` };
  }

  /**
     * update a reply
     * @param {object} req - an object
     *@return {object} Return a message saying the commmnet is deleted
     */
  static async updateOneReply(req) {
    const { replyId } = req.params;
    const { id } = req.params;
    const { body } = req.body;
    const { reply } = req.body;
    await Comment.update({ body: body || reply.body }, { where: { replyid: id, id: replyId } });
    const updatedReply = await Comment.findOne({ where: { id: replyId } });
    return { response: updatedReply };
  }

  /**
     * Add feedback on article (Either like or neutral)
     * @param {object} req - an object
     * @return {Object} Return object of feedback created
     * @static
     */
  static async createFeedback(req) {
    const { id } = req.user;
    const commentId = req.params.id;
    const { option } = req.params;
    const feedbackCreated = await CommentFeedback.create({
      userId: id,
      commentId,
      feedback: option
    });
    return feedbackCreated;
  }

  /**
     * Check if it is valid option
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return false
     * @static
     */
  static isValidOption(req, res, next) {
    if (req.params.option !== 'like') {
      return res.status(422).send({ status: 422, Error: 'Only option must only be \'like\'' });
    }
    next();
  }

  /**
     * Check if comment exist and the user who created it
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if it is valid else return a message explaining an error
     * @static
     */
  static async isItValidComment(req, res, next) {
    const { option } = req.params;
    const { id } = req.params;
    const userId = req.user.id;
    const comment = await Comment.findOne({ where: { id } });
    if (!comment) {
      return res.status(404).send({ errors: { body: ['comment  not found'] } });
    }
    const commentFeedback = await CommentFeedback
      .findOne({ where: { commentId: comment.id, userId } });
    if (!commentFeedback) {
      next();
    }
    if (option === 'like' && commentFeedback.feedback === 'like') {
      await CommentFeedback.update({ feedback: 'neutral' }, { where: { commentId: id, userId } });
      return res.status(200).send({ message: 'Your  like become neutral' });
    }
    await CommentFeedback.update({ feedback: 'like' }, { where: { commentId: id, userId } });
    return res.status(200).send({ message: 'your liked a comment' });
  }

  /**
 * Calculate number of likes per comment
 * @function likesNumber
 * @param {object} req
 * @param {object} res
 * @param {object} next
 * @returns { number } number of comments
 */
  static async likesNumber(req, res, next) {
    const { id } = req.params;
    const result = await CommentFeedback.findAndCountAll({
      where: { commentId: id, feedback: 'like' },
    });
    req.body.numberOfLikes = result.count;
    next();
    return true;
  }

  /**
     * Get likes
     * @param {object} req - an object
     * @return {Object} Returns an object
     * @static
     */
  static async getLikes(req) {
    const { id } = req.params;
    const likesFetched = await CommentFeedback.findAll({
      where: { commentId: id, feedback: 'like' },
      include: [{ model: User, as: 'liked', attributes: ['username', 'bio', 'image'] },
        { model: Comment, as: 'like', attributes: ['titleSlug', 'body'] },
      ],
    });
    return likesFetched;
  }

  /**
     * Check if comment feedback exist
     * @param {object} req - an object
     * @param {object} res - an object
     * @param {object} next - an object
     * @return {boolean} Returns if true if  fedback exists
     * @static
     */
  static async isFeedbackExist(req, res, next) {
    const { id } = req.params;
    const commentFeedback = await CommentFeedback.findOne({ where: { id } });
    if (!commentFeedback) {
      return res.status(404).send({ errors: { body: ['No feedback found'] } });
    }
    if (commentFeedback.userId !== req.user.id) {
      return res.status(404).send({ errors: { body: ['No authorized, Only Owner can delete it'] } });
    }
    next();
  }

  /**
     * Delete  comment feedback
     * @param {object} req - an object
     * @param {object} res - an object
     *@return {boolean} Return true if deleted
     */
  static async deleteFeedback(req) {
    const { id } = req.params;
    const deleteFeedback = await
    CommentFeedback.destroy({ where: { id }, returning: true });
    return deleteFeedback;
  }
}

export default CommentHelper;

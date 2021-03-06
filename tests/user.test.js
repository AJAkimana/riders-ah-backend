
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import server from '../app';
import helper from '../helpers';
import models from '../models';

chai.use(chaiHttp);
const { User } = models;
const user = {
  username: 'test',
  email: 'andela@gmail.com',
  password: '123Qa@5678'
};

const incorrectnuser = {
  email: 'eric@gmail.com',
  password: '123Qa@5678'
};

const incorrectpassword = {
  email: 'andela@gmail.com',
  password: 'abcbdbdb'
};
const token = helper.tokenGenerator(30);
const testUser = {
  email: 'testingmail@email.com',
  username: 'testingtest',
  password: 'some@pass',
  token,
  isVerified: false
};
const { email } = testUser;
let unauthorizedToken;
let superAdminToken;
let userToken;
describe('Users Authentication', () => {
  it('User Signup', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send(user)
      .end((err, res) => {
        expect(res.body).to.have.status(201);
        expect(res.body)
          .to.have.property('token')
          .to.be.a('string');
        expect(res.body.token).to.not.be.equal('');
        done();
      });
  });
  it('the user should be logged in', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/login')
      .send({
        email: 'andela@gmail.com',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        userToken = res.body.token;
        expect(res.body).to.have.property('token');
        done();
      });
  });
  it('Email is required', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtotest',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Email is required');
        done();
      });
  });
  it('Username is required', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        email: 'testtotest@gmail.com',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Username is required');
        done();
      });
  });
  it('Password is required', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtotest',
        email: 'testtotest@gmail.com'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Password is required');
        done();
      });
  });
  it('Invalid E-mail', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        email: 'testtotestgmail.com',
        username: 'testtotest',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('E-mail is invalid');
        done();
      });
  });
  it('Email already in use', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtest',
        email: 'andela@gmail.com',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('email is already in use');
        done();
      });
  });
  it('Username already in use', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'test',
        email: 'test@gmail.com',
        password: '123Qa@5678'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Username is already in use');
        done();
      });
  });
  it('Check if the password contains digit', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtoftest',
        email: 'test@gmail.com',
        password: 'aaa'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('The password Must contain at least one number');
        done();
      });
  });
  it('Check if the password contains lowercase character', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtoftest',
        email: 'test@gmail.com',
        password: '123'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('The password must contain a lower case character');
        done();
      });
  });
  it('Check if the password contains uppercase character', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtoftest',
        email: 'test@gmail.com',
        password: 'a123'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('the password should contain an uppercase character');
        done();
      });
  });
  it('Check if the password contains special character', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtoftest',
        email: 'test@gmail.com',
        password: 'a123U'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('the password should contain a special character');
        done();
      });
  });
  it('Check if the password does not contains less than 8 characters', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/signup')
      .send({
        username: 'testtoftest',
        email: 'test@gmail.com',
        password: 'a123U@'
      })
      .end((err, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('password must not be less than 8 characters');
        done();
      });
  });
  it('user login', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/login')
      .send(user)
      .end((err, res) => {
        unauthorizedToken = res.body.token;
        expect(res.body).to.have.status(200);
        expect(res.body.message).to.be.equal('User logged in successfully');
        expect(res.body)
          .to.have.property('token')
          .to.be.a('string');
        done();
      });
  });
  it('Incorrect email', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/login')
      .send(incorrectnuser)
      .end((err, res) => {
        expect(res.body).to.have.status(401);
        expect(res.body.err.message).to.be.equal('Incorrect Credentials.');
        done();
      });
  });
  it('Incorrect password', (done) => {
    chai
      .request(server)
      .post('/api/v1/users/login')
      .send(incorrectpassword)
      .end((err, res) => {
        expect(res.body).to.have.status(401);
        expect(res.body.err.message).to.be.equal('Incorrect credentials.');
        done();
      });
  });
  describe('/api/v1/users/verification. User verification link', () => {
    before(async () => {
      await User.create(testUser);
    });
    it('Should have email and token in url', (done) => {
      chai
        .request(server)
        .get('/api/v1/users/verification')
        .end((err, res) => {
          expect(res.body).to.have.status(400);
          expect(res.body.errors.body[0]).to.be.equal('No email or token found');
          done();
        });
    });
    it('Should have email and token that are saved into system', (done) => {
      chai
        .request(server)
        .get(`/api/v1/users/verification?token=${token}&email=someemail@mail.com`)
        .end((err, res) => {
          expect(res.body).to.have.status(404);
          expect(res.body.errors.body[0]).to.be.equal('User for this verification is not found');
          done();
        });
    });
    it('Should be verified', (done) => {
      chai
        .request(server)
        .get(`/api/v1/users/verification?token=${token}&email=${email}`)
        .end((err, res) => {
          expect(res.body).to.have.status(200);
          expect(res.body.message).to.be.equal('Your account has successfully verified');
          done();
        });
    });
    it('Should resent to a valid email', (done) => {
      chai
        .request(server)
        .post('/api/v1/users/send/email')
        .end((err, res) => {
          expect(res.body).to.have.status(422);
          expect(res.body.Error).to.be.an('array');
          done();
        });
    });
    it('Email sent should be in the system', (done) => {
      chai
        .request(server)
        .post('/api/v1/users/send/email')
        .send({ email: 'anyemail@somedomain.com' })
        .end((err, res) => {
          expect(res.body).to.have.status(400);
          expect(res.body.errors.body[0]).to.be.equal('User with this email not found');
          done();
        });
    });
    it('Email should be sent', (done) => {
      chai
        .request(server)
        .post('/api/v1/users/send/email')
        .send({ email })
        .end((err, res) => {
          expect(res.body).to.have.status(200);
          expect(res.body.message).to.be.equal('Email was sent. Check you email account');
          done();
        });
    });
  });
  describe('Testing Super Admin CRUD', () => {
    const newUser = {
      firstName: 'andela',
      lastName: 'sims',
      username: 'samue',
      email: 'niyitangasam.nik@andela.com'

    };
    const invalidUser = {
      lastName: 'andela',
      username: 'samuel',
      email: 'kigali@andela.com'
    };
    const updateInfo = {
      firstName: 'new user',
      lastName: 'my name',
    };
    const userLogins = {
      email: 'andela@andela.com',
      password: 'Password@1'
    };
    before((done) => {
      User.create({
        firstName: 'Kigali',
        lastName: 'Andela',
        username: 'andela',
        email: 'andela@andela.com',
        password: helper.hashPassword('Password@1'),
        roles: 'super_admin',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      chai.request(server)
        .post('/api/v1/users/login')
        .send(userLogins)
        .end((err, res) => {
          superAdminToken = res.body.token;
          done();
        });
    });
    it('Only Super Admin should perform the action', (done) => {
      chai.request(server)
        .post('/api/v1/users/')
        .send(newUser)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.have.status(201);
          expect(res.body).to.have.property('message').to.be.a('string');
          done();
        });
    });
    it('Only Super Admin must create a new user', (done) => {
      chai.request(server)
        .post('/api/v1/users/')
        .send(newUser)
        .set('authorization', unauthorizedToken)
        .end((err, res) => {
          expect(res.body).to.have.status(401);
          expect(res.body).to.have.property('message').to.be.a('string').to.be.equal('You are not a Super Admin!');
          done();
        });
    });
    it('Super Admin should provide valid info', (done) => {
      chai.request(server)
        .post('/api/v1/users/')
        .send(invalidUser)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.have.status(422);
          expect(res.body).to.have.property('Error').to.be.an('array');
          done();
        });
    });
    it('Super Admin should be able to get a specif user', (done) => {
      chai.request(server)
        .get('/api/v1/users/andela')
        .send(invalidUser)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('user').to.be.an('object');
          done();
        });
    });
    it('Super Admin should be able to update specific user', (done) => {
      chai.request(server)
        .put('/api/v1/users/andela')
        .send(updateInfo)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.status(200);
          expect(res.body).to.have.property('data').to.be.an('object');
          done();
        });
    });
    it('Super Admin should be able to deactivate a user', (done) => {
      chai.request(server)
        .put('/api/v1/users/andela/active/disable')
        .send(updateInfo)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('user').to.be.an('object');
          expect(res.body.user).to.have.property('isActive').to.be.equal(false);
          done();
        });
    });
    it('Super Admin should not disable already disabled user', (done) => {
      chai.request(server)
        .put('/api/v1/users/andela/active/disable')
        .send(updateInfo)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.status(422);
          expect(res.body).to.have.property('Error').to.be.a('string');
          expect(res.body.Error).to.be.equal('Can not perform existing action');
          done();
        });
    });
    it('Super Admin should be able to  enable a user', (done) => {
      chai.request(server)
        .put('/api/v1/users/andela/active/enable')
        .send(updateInfo)
        .set('authorization', superAdminToken)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('user').to.be.an('object');
          expect(res.body.user).to.have.property('isActive').to.be.equal(true);
          done();
        });
    });
    it('create a drop token', (done) => {
      chai
        .request(server)
        .post('/api/v1/users/logout')
        .set('Authorization', userToken)
        .end((err, res) => {
          expect(res.status).to.be.equal(201);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });
});

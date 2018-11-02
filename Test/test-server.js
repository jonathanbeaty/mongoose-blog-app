'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const mocha = require('mocha');

var expect = chai.expect;
chai.should();

const {
    BlogPost
} = require('../models');
const {
    app,
    runServer,
    closeServer
} = require('../server');
const {
    TEST_DATABASE_URL
} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
    let blogPosts = [];
    for (let i = 0; i < 10; i++) {
        blogPosts.push(createBlogPost());
    }
    return BlogPost.insertMany(blogPosts);
}

function createBlogPost() {
    return {

        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        created: faker.date.past()
    }
};

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog Posts API Resource', function () {

    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedBlogPostData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });


    describe('GET Endpoint', function () {

        it('should GET all endpoints', function () {
            BlogPost.estimatedDocumentCount().then(count => {
                console.log(count)
            });

            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.lengthOf(10);
                    return BlogPost.count();
                })
                .then(function (count) {
                    expect(res.body).to.have.lengthOf(count);
                })
        });
    });

    describe('POST Endpoint', function () {

        it('Should PUT YO Mama', (done) => {
            let post = {
                author: {
                    firstName: "Jonathan"
                },
                title: 'Howdy Town',
                content: faker.lorem.paragraph(),
                created: '10/20/2018'
            };

            chai.request(app)
                .post('/posts')
                .send(post)
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    res.body.should.have.property('content');
                    done()
                });
        });

    });

    describe('PUT Endpoint', function () {

        it('Should PUT down', (done) => {
            chai.request(app)
                .put('/posts')
                .send({
                    firstName: 'TOM',
                    lastName: 'Whizzle'
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(404);

                    done()
                });
        });
    });

    describe('DELETE endpoint', function () {
        it('delete a blog post by id', function () {

            let blogpost1;

            return BlogPost
                .findOne()
                .then(function (_blogpost) {
                    blogpost1 = _blogpost;
                    return chai.request(app).delete(`/posts/${blogpost1.id}`);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return BlogPost.findById(blogpost1.id);
                })
                .then(function (_blogpost) {
                    expect(_blogpost).to.be.null;
                });
        });
    });
});
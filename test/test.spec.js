require('mocha');
const rewire = require('rewire');
const chai = require('chai');
const expect = chai.expect;
const idx = rewire('../src/index');

describe('unit tests', () => {
    describe('group status codes', () => {
        it('should return ERR for status codes less than 100', () => {
            expect(idx.__get__('groupStatusCode')(99)).to.eql('ERR');
        });
        it('should return 1XX for status codes 100<=code<200', () => {
            expect(idx.__get__('groupStatusCode')(100)).to.eql('1XX');
            expect(idx.__get__('groupStatusCode')(199)).to.eql('1XX');
        });
        it('should return 2XX for status codes 200<=code<300', () => {
            expect(idx.__get__('groupStatusCode')(200)).to.eql('2XX');
            expect(idx.__get__('groupStatusCode')(299)).to.eql('2XX');
        });
        it('should return 3XX for status codes 300<=code<400', () => {
            expect(idx.__get__('groupStatusCode')(300)).to.eql('3XX');
            expect(idx.__get__('groupStatusCode')(399)).to.eql('3XX');
        });
        it('should return 4XX for status codes 400<=code<500', () => {
            expect(idx.__get__('groupStatusCode')(400)).to.eql('4XX');
            expect(idx.__get__('groupStatusCode')(499)).to.eql('4XX');
        });
        it('should return 5XX for status codes 500<=code<600', () => {
            expect(idx.__get__('groupStatusCode')(500)).to.eql('5XX');
            expect(idx.__get__('groupStatusCode')(599)).to.eql('5XX');
        });
        it('should return ERR for status codes above 600', () => {
            expect(idx.__get__('groupStatusCode')(600)).to.eql('ERR');
        });
    });
});

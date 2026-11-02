import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { api, createTestApp, registerUser, TestUser } from './utils';

type ApiContact = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  favorite: boolean;
};

describe('Contacts (e2e)', () => {
  let app: INestApplication<App>;
  let alice: TestUser;
  let bob: TestUser;

  const create = (user: TestUser, body: object) =>
    api(app, user).post('/api/contacts').send(body);

  beforeAll(async () => {
    app = await createTestApp();
    alice = await registerUser(app);
    bob = await registerUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/api/contacts').expect(401);
  });

  it('creates a contact in the shape the client uses', async () => {
    const res = await create(alice, {
      firstName: 'Kofi',
      phoneNumber: '024 555 0000',
    }).expect(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      firstName: 'Kofi',
      lastName: '',
      phoneNumber: '024 555 0000',
      favorite: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('lists alphabetically, ignoring case', async () => {
    await create(alice, { firstName: 'bob', phoneNumber: '0200000001' }).expect(
      201,
    );
    await create(alice, {
      firstName: 'Abena',
      phoneNumber: '0200000002',
    }).expect(201);

    const res = await api(app, alice).get('/api/contacts').expect(200);
    expect((res.body as ApiContact[]).map((c) => c.firstName)).toEqual([
      'Abena',
      'bob',
      'Kofi',
    ]);
  });

  it('refuses a number that is already saved, naming the contact', async () => {
    const res = await create(alice, {
      firstName: 'Copy',
      phoneNumber: '0245550000',
    }).expect(409);
    expect((res.body as { message: string }).message).toBe(
      'This number is already saved as Kofi',
    );

    // Another user may save the same number.
    await create(bob, { firstName: 'Kofi', phoneNumber: '0245550000' }).expect(
      201,
    );
  });

  it('updates fields and keeps the duplicate rule', async () => {
    const list = await api(app, alice).get('/api/contacts').expect(200);
    const [abena, bobContact] = list.body as ApiContact[];

    const starred = await api(app, alice)
      .patch(`/api/contacts/${abena.id}`)
      .send({ favorite: true, lastName: 'Mensah' })
      .expect(200);
    expect(starred.body).toMatchObject({ favorite: true, lastName: 'Mensah' });

    await api(app, alice)
      .patch(`/api/contacts/${bobContact.id}`)
      .send({ phoneNumber: '0200000002' })
      .expect(409);
  });

  it("keeps each user's contacts private", async () => {
    const [aliceContact] = (await api(app, alice).get('/api/contacts'))
      .body as ApiContact[];

    const bobsList = await api(app, bob).get('/api/contacts').expect(200);
    expect((bobsList.body as ApiContact[]).map((c) => c.id)).not.toContain(
      aliceContact.id,
    );

    await api(app, bob).get(`/api/contacts/${aliceContact.id}`).expect(404);
    await api(app, bob)
      .patch(`/api/contacts/${aliceContact.id}`)
      .send({ favorite: true })
      .expect(404);
    await api(app, bob).delete(`/api/contacts/${aliceContact.id}`).expect(404);
  });

  it('gets one contact by id (for opening the detail page directly)', async () => {
    const [first] = (await api(app, alice).get('/api/contacts'))
      .body as ApiContact[];
    const res = await api(app, alice)
      .get(`/api/contacts/${first.id}`)
      .expect(200);
    expect(res.body).toEqual(first);
    await api(app, alice).get('/api/contacts/not-an-id').expect(400);
  });

  it('deletes, and rejects malformed ids', async () => {
    const [contact] = (await api(app, alice).get('/api/contacts'))
      .body as ApiContact[];
    await api(app, alice).delete(`/api/contacts/${contact.id}`).expect(204);
    await api(app, alice).delete(`/api/contacts/${contact.id}`).expect(404);
    await api(app, alice).delete('/api/contacts/not-an-id').expect(400);
  });
});

# Dog breed rater

Now you can rate which breed you like! Available at [https://goodboi.lyrete.dev].

## TODO

- [x] List dog breeds (data fetched from [https://dog.ceo/api/breeds/list/all])
- [x] Clicking on a breed gives a view with a random pic + rating options. (random pic from [https://dog.ceo/api/breed/{breed}/{subbreed}/images/random])
- [x] Show total number of votes + overall rating

- [ ] Scroll the list to selected breed (esp. in the start with the preselected sheltie :D)
- [ ] Cache breed list on the server + enter them into DB and only check for new breeds on load (so don't need to wait).
- [ ] Place pretty names in DB (Schema already supports this)

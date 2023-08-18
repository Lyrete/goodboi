# Dog breed rater

Now you can rate which breed you like! Available at [https://goodboi.lyrete.dev].

## TODO

- [x] List dog breeds (data fetched from [https://dog.ceo/api/breeds/list/all])
- [x] Clicking on a breed gives a view with a random pic + rating options. (random pic from [https://dog.ceo/api/breed/{breed}/{subbreed}/images/random])
- [x] Show total number of votes + overall rating
- [x] Scroll the list to selected breed

- [ ] Improve breed loading, store breeds in DB + cache and just call the api to check for new dogs.
- [ ] Show random new breed after voting. (delay for a bit to see new rating)
- [ ] Cool +1/-1 animation after clicking vote
- [ ] Don't blow out low-res pics
- [ ] Scroll list when cursor close to edge
- [ ] KB navigable list

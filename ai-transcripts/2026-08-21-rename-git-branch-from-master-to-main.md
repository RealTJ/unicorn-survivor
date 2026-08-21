## Me
Rename local master branch into main in git?

## AI Assistant
To rename the local `master` branch to `main`:

```shell script
git branch -m master main
```


If you are currently checked out on `master`, you can use:

```shell script
git branch -m main
```


To update the remote repository as well:

```shell script
git push -u origin main
git push origin --delete master
```


If the remote’s default branch is still `master`, change it to `main` in your Git hosting service settings before deleting `master`.

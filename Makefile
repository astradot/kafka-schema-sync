.PHONY: git-tag-push
git-tag-push:
	git tag $(TAG)
	git push origin
	git push origin --tags

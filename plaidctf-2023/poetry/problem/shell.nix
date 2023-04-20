{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
      # Without pkg-config, for some reason unicorn breaks on arm machines?
      # Anyways, ensure that pkg-config is around.
      pkg-config

      poetry
    ];
}

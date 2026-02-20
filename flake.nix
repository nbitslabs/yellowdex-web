{
  description = "Dev environment for yellowdex landing (Astro + Tailwind)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_20
            pnpm
            git
          ];

          shellHook = ''
            export NODE_OPTIONS="--enable-source-maps"
            export NPM_CONFIG_FUND=0
            export NPM_CONFIG_AUDIT=0
          '';
        };
      });
}
